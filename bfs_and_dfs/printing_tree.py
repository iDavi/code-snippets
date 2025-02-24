#viral twitter problem: https://x.com/vikhyatk/status/1873033432705712304/photo/1
"""
i have a very simple question i ask during phone screens: print each level of a tree on a separate line.

90% of CS grad candidates just can't do it. someone needs to investigate these universities.
"""

class Node:
    def __init__(self, value):
        self.val = value
        self.left = None
        self.right = None
    def print(self) -> None:
        queue = [self]
        current_index = 0
        maximium_per_line = 1
        print("", end="\n")
        while queue:
            node = queue.pop(0)
            #print(current_index)
            #print(maximium_per_line)
            if current_index == maximium_per_line:
                print("", end="\n")
                maximium_per_line *= 2
                current_index = 0
            print(node.val, end=" ")
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
            current_index += 1
        print("", end="\n")


def add(self, val):
    if(self.left == None): #I'm inserting preferably in left, without sorting (since tree can accept values of any type)
        self.left = Node(val)
        return self.left
    elif(self.right == None):
        self.right = Node(val)
        return self.right
    return add(self.left, val)
    


tree = Node(1)
add(tree, 2)
add(tree, 3)
add(tree, 4)        
add(tree, 5)
add(tree, 6)
tree.print()