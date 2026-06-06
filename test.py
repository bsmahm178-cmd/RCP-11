# test.py

def welcome_message():
    return "تست تست تست "

def add_numbers(a, b):
    return a + b

def say_hello(name):
    return f"Hello {name}!"

if __name__ == "__main__":
    print(welcome_message())
    print(f"5 + 3 = {add_numbers(5, 3)}")
    print(say_hello("GitHub"))