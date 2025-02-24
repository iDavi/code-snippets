#leetcode problem: https://leetcode.com/problems/best-time-to-buy-and-sell-stock/

class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        left = prices[0]
        max_profit = 0
        for right in prices[1:]:
            if left>right:
                left = right
                continue
            max_profit = max(max_profit, right-left)
        return max_profit
                
            
            
            