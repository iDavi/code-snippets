
"""
Problem 1: Is Possible
Consider a pair of intergers (a,b). The following operations can be performed on a,b in any order, zero or more times

* (a,b) -> (a+b,b)

*(a,b)-> (a,a+b)

Return a string that denotes whether or not (a,b) can be converted to (c,d) by performing the operation zero or more times"""

#recursive DFS approach:
def is_possible(a:int, b:int, c:int, d:int) -> str:
    
    def is_possible_aux(a:int, b:int, c:int, d:int, op1:int=0, op2:int=0, op_list:list=[]) -> tuple:
        #We can easily identify that we can solve this challenge by using a backtracking approach. We can search the answer
        #In a tree of possibilities.
        print((a,b))
        if(a>c or b>d):
            return (op1, op2, False, op_list)
    
        if(a==c and b==d):
            return (op1, op2, True, op_list)
        
        #Here, we have two stop conditions. The first one is in case of a or b being bigger than c or d. If this is true,
        #we can't reach our target (c,d) by growing the a and b. The second one is if a==c and b==d, which means we found our path to the solution
        
        
        op1_res = is_possible_aux(a+b, b, c, d , op1+1, op2, op_list + [1])
        op2_res = is_possible_aux(a, b+a, c, d , op1, op2+1, op_list + [2])

        #We can imagine we are searching in the left and the right node's subtrees of our possibility tree

        if op1_res[2]:
            return op1_res
        
        
        if op2_res[2]:
            return op2_res
        
        return (op1,op2,False, op_list)
    
    res = is_possible_aux(a,b,c,d)
    
    if(res[2]):
        return f"({a}, {b}) can be converted to ({c}, {d}) by performing the first operation {res[0]} times and the second {res[1]} times, in this order {", ".join(map(str, res[3]))}"
    return f"({a}, {b}) can't be converted to ({c}, {d})."
    


#interactive DFS approach:
def is_possible_i(a:int, b:int, c:int, d:int) -> str:
    stack = [(a,b,[],0,0)]
    found = False
    while stack:
        node = stack.pop()
        if node[0] > c or node[1] > d:
            continue

        if(node[0]==c and node[1]==d):
            found = node
            break

        stack.append((node[0],node[0]+node[1], node[2] + [2], node[3], node[4]+1))
        stack.append((node[0]+node[1],node[1], node[2] + [1], node[3]+1, node[4]))

    if found:
        return f"({a}, {b}) can be converted to ({c}, {d}) by performing the first operation {found[3]} times and the second {found[4]} times, in this order {", ".join(map(str, found[2]))}"
    return f"({a}, {b}) can't be converted to ({c}, {d})."


#BFS approach

def is_possible_bfs(a:int, b:int, c:int, d:int) -> str:
    queue = [(a,b,[],0,0)]
    found = False
    while queue:
        node = queue.pop(0)
        if node[0] > c or node[1] > d:
            continue

        if(node[0]==c and node[1]==d):
            found = node
            break

        queue.append((node[0],node[0]+node[1], node[2] + [2], node[3], node[4]+1))
        queue.append((node[0]+node[1],node[1], node[2] + [1], node[3]+1, node[4]))

    if found:
        return f"({a}, {b}) can be converted to ({c}, {d}) by performing the first operation {found[3]} times and the second {found[4]} times, in this order {", ".join(map(str, found[2]))}"
    return f"({a}, {b}) can't be converted to ({c}, {d})."


    
print(is_possible_i(2, 3, 2, 7))
    
print(is_possible_bfs(2, 3, 2, 7))
    

