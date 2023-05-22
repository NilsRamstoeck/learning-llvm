#include <string>

#include "llvm/IR/IRBuilder.h"
#include "llvm/IR/LLVMContext.h"
#include "llvm/IR/Module.h"
#include "llvm/IR/Verifier.h"

#pragma once

class TSNativeLLVM
{

public:
  TSNativeLLVM() { moduleInit(); }

  void exec(const std::string &program)
  {

    compile();
    module->print(llvm::outs(), nullptr);
    saveModuleToFile("./dist/out.ll");
  }

private:
  std::unique_ptr<llvm::LLVMContext> context;
  std::unique_ptr<llvm::Module> module;
  std::unique_ptr<llvm::IRBuilder<>> builder;

  llvm::Function* fn;

  void compile(/*TODO: ast*/)
  {
    fn = createFunction("main", llvm::FunctionType::get(builder->getInt32Ty(), false));
    auto result = gen(/*ast*/);
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
  llvm::Value *gen()
  {
    return builder->getInt32(0);
  }

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

  void createFunctionBlock(llvm::Function* fn){
    auto entry = createBasicBlock("entry", fn);
    builder->SetInsertPoint(entry);
  }

  llvm::BasicBlock *createBasicBlock(std::string name, llvm::Function* fn = nullptr){
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