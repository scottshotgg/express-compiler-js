#include "var.cpp"
#include <iostream>

using namespace std;

class Object {
  private:
    map<int, var> intKeys;
    map<string, var> stringKeys;

  public:
    void AddProp(int key, var value) {
      intKeys[key] = value;
      return;
    }

    void AddProp(string key, var value) {
      stringKeys[key] = value;
      return;
    }

    var &operator[](int key) {
      return intKeys[key];
    }

    var &operator[](string key) {
      return stringKeys[key];
    }

};
