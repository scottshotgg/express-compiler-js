#include <iostream>
#include <iomanip>
#include <list>
#include <map>
#include <string>
#include <limits>

using namespace std;

enum varType {
  pointerType,
  intType,
  boolType,
  charType,
  floatType,
  stringType,
  structType,
  objectType,
  arrayType
};

class var {
private:
  varType type;
  void* data;
  int precision;

public:
  void deallocate() {
    switch (type) {
    case intType: {
      // cout << "int decons; Type: " << type << " Value: " << *(int *)data
      //    << " Pointer: " << data << endl;
      delete (int *)data;
      break;
    }

    case boolType: {
      // cout << "bool decons; Type: " << type << " Value: " << *(bool *)data
      //    << " Pointer: " << data << endl;
      delete (bool *)data;
      break;
    }

    case floatType: {
      // cout << "float decons; Type: " << type << " Value: " << *(float *)data
      //    << " Pointer: " << data << endl;
      delete (double *)data;
      break;
    }

    case charType: {
      // cout << "char decons; Type: " << type << " Value: " << *(char *)data
      //    << " Pointer: " << data << endl;
      delete (char *)data;
      break;
    }

    case stringType: {
      // cout << "string decons; Type: " << type << " Value: " << *(string
      // *)data
      //    << " Pointer: " << data << endl;
      // delete (string *)data;
      break;
    }

    case objectType: {
      // cout << "object decons; Type: " << type << " Value: " << *this
      //    << " Pointer: " << data << endl;
      delete (map<var, var> *)data;
      break;
    }

    default:
      printf("don't know how to deallocate; Type: %u Value: %p\n", type, data);
    }
  }

  // var(const var &value) {
  //   type = value.Type();

  //   switch (type) {
  //     // Not sure how to deal with this for now
  //     // case pointerType:

  //     case intType:
  //       int* dr = new int(*(int*)value.Value());
  //   }

  // }

  var(void) : type(objectType), data(new map<var, var>) {}
  var(void *value) : type(pointerType), data(value) {}

  var(int value) : type(intType), data(new int(value)) {
    // cout << "int cons; Type: " << type << " Value: " << value
    //    << " Pointer: " << data << endl;
  }

  var(bool value) : type(boolType), data(new bool(value)) {
    // cout << "bool cons; Type: " << type << " Value: " << value
    //    << " Pointer: " << data << endl;
  }

  var(char value) : type(charType), data(new char(value)) {}

  var(float value) : type(floatType), data(new double(value)) {
    // cout << "float cons; Type: " << type << " Value: " << value
    //    << " Pointer: " << data << endl;
  }

  var(double value) : type(floatType), data(new double(value)) {

    // cout << "float cons; Type: " << type << " Value: " << value
    //    << " Pointer: " << data << endl;
  }

  // all string literal constructions are going in here
  var(const char *value) : type(stringType), data(new string(value)) {
    // cout << "string cons; Type: " << type << " Value: \"" << value
    //    << "\" Pointer: " << data << endl;
  }

  var(string value) : type(stringType), data(new string(value)) {
    // cout << "string cons; Type: " << type << " Value: \"" << value
    //    << "\" Pointer: " << data << endl;
  }

  var(map<var, var> propMap)
      : type(objectType), data(new map<var, var>(propMap)) {
    // cout << "object cons; Type: " << type << " Value: \""
    //    << "\" Pointer: " << data << endl;
    // data = new map<var,var>(propMap);
  }

  var(initializer_list<var> propList) : type(objectType) {

    // TODO: need to merge in the var changes
    map<var, var> object;

    int i = 0;
    for (auto prop : propList) {
      object[i] = prop;

      i++;
    }

    // something weird is happening here....
    data = &object;
    // FIXME: ... somehow this will work ...
    // *(map<var, var>*)data = object;
  }

  // TODO: will have to do something special here, maybe code generation?
  // var(struct value) : type(structType), data(&value) {}
  // TODO: not sure if you can do this with a map, might have to copy everything
  // over var(map<var, var> value) : type(objectType), data(new map<var,
  // var>(value)) {
  //     ////printf("obj cons\n");
  // }
  // FIXME: might take this out, kind of unsafe
  var(varType iType, void *iData) : type(iType), data(iData) {
    // //printf("void*\n");
  }

  varType Type(void) const { return type; }

  void *Value(void) const { return data; }

  var &operator[](var attribute) {
    if (type == objectType) {
      return (*(map<var, var> *)data)[attribute];
    } else {
      type = objectType;
      map<var, var> object;
      object[attribute] = 0;

      data = (void *)&object;
      return (*(map<var, var> *)data)[attribute];
    }
  }

  void operator+=(const int right) {
    // //printf("+= var int\n");
    *(int *)data += right;
  }

  void operator+=(const double right) {
    // printf("+= var int\n");
    *(double *)data += right;
  }

  void operator+=(const string right) {
    // printf("+= var int\n");
    *(string *)data = *(string *)data + right;
  }

  void operator+=(const char *right) {
    // printf("+= var int\n");
    *(string *)data = *(string *)data + right;
  }

  void operator+=(const bool right) {
    // printf("+= var int\n");
    *(bool *)data = *(bool *)data || right;
  }

  void operator-=(const int right) {
    // //printf("+= var int\n");
    *(int *)data -= right;
  }

  void operator-=(const double right) {
    // //printf("+= var int\n");
    *(double *)data -= right;
  }

  void operator-=(const string right) {
    // //printf("+= var int\n");
    *(string *)data += right;
  }

  void operator-=(const char *right) {
    // //printf("+= var int\n");
    *(string *)data += right;
  }

  void operator-=(const bool right) {
    // //printf("+= var int\n");
    *(bool *)data += right;
  }

  int operator*(const var &right) {
    // //printf("* var var\n");
    return *(int *)data * *(int *)right.data;
  }

  void operator*=(const bool right) {
    // //printf("* var var\n");
    *(bool *)data = *(bool *)data && right;
  }

  void operator=(const int right) {
    if (type == intType) {
      *(int *)data = right;
    } else {
      // var::~var();
      deallocate();
      // printf("int cons; Type: %u Value: %p\n", type, data);
      type = intType;
      data = new int(right);
      // *(int*)data = right;
    }
  }

  void operator=(const double right) {
    if (type == floatType) {
      *(double *)data = right;
    } else {
      // var::~var();
      deallocate();
      // printf("float cons; Type: %u Value: %p\n", type, data);
      type = floatType;
      data = new double(right);
      // *(float*)data = right;
    }
  }

  void operator=(const char *right) {
    if (type == stringType) {
      *(string *)data = right;
    } else {
      // var::~var();
      deallocate();
      // cout << "string cons; Type: " << type << " Value: \"" << right
      //    << "\" Pointer: " << data << endl;
      type = stringType;
      data = new string(right);
      // *(string*)data = right;
    }
  }
  
  
  friend bool operator>(const var &left, const var &right);
  friend bool operator<(const var &left, const var &right);

  void operator=(const bool right) {
    if (type == boolType) {
      *(bool *)data = right;
    } else {
      // var::~var();
      deallocate();
      // printf("bool cons; Type: %u Value: %p\n", type, data);
      type = boolType;
      data = new bool(right);
      // *(bool*)data = right;
    }
  }

  // FIXME: fix this
  void operator=(initializer_list<var> propList) {
    deallocate();
    // //cout << "object cons; Type: " << type << " Value: " << propList << "
    // Pointer: " << data << endl;
    // cout << "object cons; Type: " << type << " Pointer: " << data << endl;
    type = objectType;
    data = var(propList).data;
    // var thing = propList;
    // //cout << thing << endl;
    // data = thing.data;
  }

  friend ostream &operator<<(ostream &stream, var v) {
    switch (v.type) {
    case intType:
      // //printf("printing int\n");
      return stream << *(int *)v.data;

    case boolType:
      if (*(bool *)v.data) {
        return stream << "true";
      }
      return stream << "false";

    case charType:
      return stream << "\"" << *(char *)v.data << "\"";

    case floatType:
      return stream
        << std::setprecision (std::numeric_limits<double>::digits10 + 1)
        << *(double *)v.data;

    case stringType:
      // //cout << "printing string" << endl;;
      return stream << "\"" << *(string *)v.data << "\"";

    case objectType: {
      int counter = 0;
      map<var, var> objectMap = *(map<var, var> *)v.data;
      stream << "{ ";
      for (auto property : objectMap) {
        // stream << property.first << property.second.first <<
        // property.second.second << "\n";
        stream << property.first << ": " << property.second;

        if (counter < objectMap.size() - 1) {
          stream << ", ";
        }
        counter++;
      }
      return stream << " }";
    }

    default:
      printf("wtf to do Type: %u\n", v.type);
    }

    return stream;
  }
};

typedef var object;

// TODO: for right now, instead of doing the map[string]function to figure out
// the value
// https://stackoverflow.com/questions/4972795/how-do-i-typecast-with-type-info
// https://stackoverflow.com/questions/2136998/using-a-stl-map-of-function-pointer

// FIXME: for some reason this is already working
bool operator>(const var &left, const var &right) {
  // FIXME: gotta switch on the type here
  // if they're the same type
  //    compare the data values
  // if they're different
  //    compare using the 'upgrade-able types' formula

    // If the types are the same ...
  if (left.type == right.type) {
    // Determine the type of comparison based on the type
    switch (left.type) {
      case intType: {
        cout << "intType" << endl;
        cout << *(int *)left.data << " " << *(int *)right.data << endl;
        return *(int *)left.data > *(int *)right.data;
      }

      case boolType: {
        cout << "boolType" << endl;
        return *(bool *)left.data > *(bool *)right.data;
      }

      case floatType: {
        cout << "floatType" << endl;
        return *(double *)left.data > *(double *)right.data;
      }

      case charType: {
        cout << "charType" << endl;
        return *(char *)left.data > *(char *)right.data;
      }

      case stringType: {
        cout << "stringType" << endl;
        return *(int *)left.data > *(int *)right.data;
      }

      // case objectType: {
      //   cout << "objectType" << endl;
      //   return *(map<var, var> *)left.data > *(map<var, var> *)right.data;
      // }
    }
  }
  
  return *(int *)left.data > *(int *)right.data;
}

// FIXME: for some reason this is already working
bool operator<(const var &left, const var &right) {
  // FIXME: gotta switch on the type here
  // if they're the same type
  //    compare the data values
  // if they're different
  //    compare using the 'upgrade-able types' formula

  // If the types are the same ...
  if (left.type == right.type) {
    // Determine the type of comparison based on the type
    switch (left.type) {
      case intType: {
        // cout << "intType" << endl;
        // cout << *(int *)left.data << " " << *(int *)right.data << endl;
        return *(int *)left.data < *(int *)right.data;
      }

      case boolType: {
        // cout << "boolType" << endl;
        return *(bool *)left.data < *(bool *)right.data;
      }

      case floatType: {
        // cout << "floatType" << endl;
        return *(double *)left.data < *(double *)right.data;
      }

      case charType: {
        // cout << "charType" << endl;
        return *(int *)left.data < *(int *)right.data;
      }

      case stringType: {
        // cout << "stringType" << endl;
        return *(string *)left.data < *(string *)right.data;
      }

      case objectType: {
        // cout << "objectType" << endl;
        // *(map<var, var> *)left.data < *(map<var, var> *)right.data;
        // cout << "hey its me " << endl;
        return *(map<var, var> *)left.data < *(map<var, var> *)right.data;
      }
    }
  }

  // TODO: got to do something if htere is a bool type becuase of the weak typing
  if (left.type == boolType || right.type == boolType)
    return true;

  return *(int *)left.data < *(int *)right.data;
}

// Integer operations
int operator+(const int left, const var &right) {
  // //printf("+ int var\n");
  return left + *(int *)right.Value();
}

int operator-(const int left, const var &right) {
  // //printf("+ int var\n");
  return left - *(int *)right.Value();
}

int operator*(const int left, const var &right) {
  // //printf("+ int var\n");
  return left * *(int *)right.Value();
}

int operator/(const int left, const var &right) {
  // //printf("+ int var\n");
  return left / *(int *)right.Value();
}

int operator+=(int left, const var &right) {
  // printf("+= int var\n");
  // //printf("+= int var\n");
  return left += *(int *)right.Value();
}

int operator+=(const var &left, const var &right) {
  //   //printf("+= var var\n");
  return *(int *)left.Value() + *(int *)right.Value();
}

bool operator+(const bool left, const var &right) {
  return left || *(bool *)right.Value();
}

// TODO: not sure about this one for now
// char operator+(const char left, const var& right) {
//     return left || *(bool*)right.Value();
// }

float operator+(const float left, const var &right) {
  return (double)(left) + *(double *)right.Value();
}

double operator+(const double left, const var &right) {
  return left + *(double *)right.Value();
}

// String/Char* operations: convert char* to string with all of these functions
string operator+(const char *left, const var &right) {
  return left + *(string *)right.Value();
}

var operator+(const var &left, const char *right) {
  return var(*(string *)left.Value() + right);
}

// int operator+(const var &left, const var &right) {
//     //printf("hey its me");
//   return *(int*)left.Value() + *(int*)right.Value();
// }

// Generic constructor for right side value
template <typename T> var operator+(const var &left, T right) {
  // FIXME: this is kinda inefficient
  return var(right + left);
}

// Generic constructor for right side value
template <typename T> var operator-(const var &left, T right) {
  // FIXME: this is kinda inefficient
  return var(-right + left);
}

// // Generic constructor for right side value
// template <typename T> var operator*(const var &left, T right) {
//   // FIXME: this is kinda inefficient
//   cout<<"right "<<right<<endl;
//   cout<<"left "<<left<<endl;
//   var thing = right * left;
//   cout<<"thing"<< thing << endl;
//   return thing;
// }

// Generic constructor for right side value
template <typename T> var operator/(const var &left, T right) {
  // FIXME: this is kinda inefficient
  return var((1 / right) * left);
}
// };