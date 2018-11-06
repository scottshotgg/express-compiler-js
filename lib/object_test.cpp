#include "object.cpp"

using namespace std;

int main() {
  Object obj;

  obj.AddProp(5, 79);
  obj.AddProp("5", "79");
  obj[5] = obj[5] + 9;
 
  cout << obj[5] << endl;
  cout << obj["5"] << endl;
}