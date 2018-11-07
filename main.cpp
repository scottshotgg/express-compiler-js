#include "lib/object.cpp"
#include "lib/std.cpp"
#include <stdlib.h>
#include <string>
using namespace std;
int main() {
  int c = 6;
  float d = 5.5 + 0.5;
  Object obj2;
  {
    Object o;
    int a = 60;
    int d = a;
    {
      for (int temp = 1; temp < a; temp++) {
        d = d + 1;
      }
    }
    string b = "something else";
    float c = 7.7;
    o.AddProp("a", a);
    o.AddProp("d", d);
    o.AddProp("b", b);
    o.AddProp("c", c);
    obj2 = o;
  }
  Println("d:", d);
  Println("obj2.d:", obj2["d"]);
  Println("this is a string", to_string(65));
}