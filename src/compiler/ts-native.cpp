#include <string>
#include "./TSNative.h"
// #include <fstream>

int main(int argc, char const *argv[])
{
  // if (argc == 0)
  // {
  //   return 1;
  // }
  // std::ifstream myfile("shopping_list.txt");
  // std::string program;
  // if (myfile.is_open())
  // {

  //   myfile >> program;
  // }

  TSNativeLLVM compiler; 
  compiler.exec(R"(

    44

  )");
}