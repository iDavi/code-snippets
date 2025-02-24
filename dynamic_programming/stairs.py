#https://leetcode.com/problems/climbing-stairs/description/

#dfs approach with memoization:
def unique_ways(n, memo=None):
    if memo==None:
        memo = {0: 1}
    if n < 0:
        return 0
    if not n in memo:
        memo[n] = unique_ways(n-1, memo) + unique_ways(n-2, memo)
    return memo[n]

print(unique_ways(5))
#1
#

#2
#1+1
#2

#3
#1+1+1
#2+1
#1+2

#4
#1+1+1+1
#2+1+1
#1+2+1
#1+1+2
#2+2


