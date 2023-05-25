#include <string>
#include <fstream>
#include <iostream>
#include "./TSNative.h"
#include <utility>

int main(int argc, char const *argv[])
{
  std::ifstream program("./dist/ast.json");
  TSNativeLLVM compiler;
  compiler.exec(program);
}