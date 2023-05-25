#include <string>
#include <map>
#include <utility>
#include <iostream>

#include "llvm/IR/IRBuilder.h"
#include "llvm/IR/LLVMContext.h"
#include "llvm/IR/Module.h"
#include "llvm/IR/Verifier.h"
#include "./json.hpp"

#pragma once

using JSON = nlohmann::json;

class TSNativeLLVM
{

public:
  TSNativeLLVM() { moduleInit(); }

  void exec(std::ifstream &program)
  {
    JSON ast = JSON::parse(program);

    compile(ast);
    module->print(llvm::outs(), nullptr);
    saveModuleToFile("./dist/out.ll");
  }

private:
  std::unique_ptr<llvm::LLVMContext> context;
  std::unique_ptr<llvm::Module> module;
  std::unique_ptr<llvm::IRBuilder<>> builder;

  std::map<std::string, llvm::Value *> NamedValues;

  llvm::Function *fn;

  void compile(JSON ast)
  {
    fn = createFunction("main", llvm::FunctionType::get(builder->getInt32Ty(), false));
    auto result = gen(ast);
    auto i32Result = builder->CreateIntCast(result, builder->getInt32Ty(), true);
    auto ret = builder->CreateRet(i32Result);
  }

  /**
   *
   * THIS IS WHERE CODE NEEDS TO BE GENERATED
   * Recursive?
   * IDEA:
   *  gen takes an AST Node uses a hash map to map to a function that can compile it:
   *  those functions can rely on gen to compile their children
   */
  llvm::Value *gen(JSON node)
  {
    static const std::map<std::string, std::function<llvm::Value *(JSON)>> map = {
        {"Program", std::bind(&TSNativeLLVM::Program, this, std::placeholders::_1)},
        {"FunctionDeclaration", std::bind(&TSNativeLLVM::FunctionDeclaration, this, std::placeholders::_1)},
        {"CallExpression", std::bind(&TSNativeLLVM::CallExpression, this, std::placeholders::_1)},
        {"ConstantDefinition", std::bind(&TSNativeLLVM::ConstantDefinition, this, std::placeholders::_1)},
        /**/};

    std::string type = node.value("type", "");

    if (type == "")
      return nullptr;

    auto gen = map.find(type)->second;

    if (gen == nullptr)
      return nullptr;

    return gen(node);
  }

  /***** AST NODE PARSING *****/

  llvm::Value *Program(JSON node)
  {
    std::vector<JSON> body = node["body"].get<std::vector<JSON>>();
    for (JSON child_node : body)
    {
      gen(child_node);
    }
    return builder->getInt32(0);
  }

  llvm::Value *Expression(JSON node)
  {
    static const std::map<std::string, std::function<llvm::Value *(JSON)>> map = {
        {"CallExpression", std::bind(&TSNativeLLVM::CallExpression, this, std::placeholders::_1)},
        {"StringLiteral", std::bind(&TSNativeLLVM::StringLiteral, this, std::placeholders::_1)},
        {"Identifier", std::bind(&TSNativeLLVM::VariableExpression, this, std::placeholders::_1)}
        /**/};

    std::string type = node.value("type", "");

    if (type == "")
      return nullptr;

    auto gen = map.find(type)->second;

    if (gen == nullptr)
      return nullptr;

    return gen(node);
  }

  llvm::Value *CallExpression(JSON node)
  {
    std::string name = node["callee"].get<JSON>()["name"].get<std::string>();
    builder->CreateCall(
        module->getFunction(name),
        Arguments(node["arguments"].get<std::vector<JSON>>())
        /**/);
    return nullptr;
  }

  llvm::Value *FunctionDeclaration(JSON node)
  {
    std::string name = node["id"].get<JSON>()["name"].get<std::string>();
    std::vector<llvm::Type *> params = Parameters(node);

    llvm::FunctionType *fnType = llvm::FunctionType::get(
        builder->getVoidTy(), // return type
        params,               // parameters
        false);               // is vararg

    return createFunctionProto(name, fnType);
  }

  llvm::Value *ConstantDefinition(JSON node)
  {
    llvm::Value *value = Expression(node["value"].get<JSON>());
    llvm::Type *type = value->getType();
    std::string name = node["id"].get<JSON>()["name"].get<std::string>();
    llvm::Value* constant = builder->CreateBitCast(value, type, name);;
    
    NamedValues[name] = constant;
    return constant;
  }

  std::vector<llvm::Type *> Parameters(JSON node)
  {
    std::vector<llvm::Type *> params;
    // auto params = new std::vector<llvm::Type *>();

    for (JSON parameter : node["params"].get<std::vector<JSON>>())
    {
      params.push_back(Type(parameter["valueType"].get<std::string>()));
    }
    return params;
  }

  std::vector<llvm::Value *> Arguments(std::vector<JSON> nodes)
  {
    std::vector<llvm::Value *> args;
    // auto params = new std::vector<llvm::Type *>();

    for (JSON argument : nodes)
    {
      args.push_back(Expression(argument));
    }
    return args;
  }

  llvm::Value *VariableExpression(JSON node)
  {
    std::cout << node << std::endl;
    std::string name = node["name"].get<std::string>();
    return NamedValues[name];
  }

  llvm::Type *Type(std::string type)
  {

    static const std::map<std::string, std::function<llvm::Type *(void)>> map = {
        {"string", std::bind(&TSNativeLLVM::StringType, this)}
        /**/};

    if (type == "")
      return nullptr;

    auto gen = map.find(type)->second;

    if (gen == nullptr)
      return nullptr;

    return gen();
  }

  llvm::Type *StringType()
  {
    return llvm::Type::getInt8PtrTy(*context);
  }

  llvm::Value *StringLiteral(JSON node)
  {
    std::string value = node["value"].get<std::string>();
    llvm::Value *irvalue = builder->CreateGlobalString(value);
    builder->CreateBitCast(irvalue, builder->getInt8PtrTy());
    return builder->CreateBitCast(irvalue, builder->getInt8PtrTy());
  }

  /***** LLVM IR GENERATION *****/

  llvm::Function *createFunction(const std::string &fnName, llvm::FunctionType *fnType)
  {
    auto fn = module->getFunction(fnName);
    if (fn == nullptr)
    {
      fn = createFunctionProto(fnName, fnType);
    }

    createFunctionBlock(fn);
    return fn;
  }

  void createFunctionBlock(llvm::Function *fn)
  {
    auto entry = createBasicBlock("entry", fn);
    builder->SetInsertPoint(entry);
  }

  llvm::BasicBlock *createBasicBlock(std::string name, llvm::Function *fn = nullptr)
  {
    return llvm::BasicBlock::Create(*context, name, fn);
  }

  llvm::Function *createFunctionProto(const std::string &fnName, llvm::FunctionType *fnType)
  {
    auto fn = llvm::Function::Create(fnType, llvm::Function::ExternalLinkage, fnName, *module);
    verifyFunction(*fn);
    return fn;
  }

  void saveModuleToFile(const std::string &fileName)
  {
    std::error_code errorCode;
    llvm::raw_fd_ostream outLL(fileName, errorCode);
    module->print(outLL, nullptr);
  }

  void moduleInit()
  {
    context = std::make_unique<llvm::LLVMContext>();
    module = std::make_unique<llvm::Module>("TSNativeLLVM", *context);
    builder = std::make_unique<llvm::IRBuilder<>>(*context);
  }
};