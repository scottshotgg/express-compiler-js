#include "lib/std.cpp"
#include <string>
using namespace std;
class thing {
public:
  string something() { return s; }

  int i = 15;
  float f = 0;
  bool b = false;
  string s = "";
};

thing somethingElse() {
  thing t = thing{
      2,
      67.65,
      true,
      "hey its me",
  };
  return t;
}

int main() {
  printf("printf value is:      %s\n", somethingElse().something().c_str());
  Println("std.Println value is:", somethingElse().something());
}