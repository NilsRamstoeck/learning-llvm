#include <iostream>
extern "C" void print(char *s)
{
  std::cout << s << std::endl;
}

// int main(){
//   print("HALLO WELT");
// }