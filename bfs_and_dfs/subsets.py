#leetcode problem: https://leetcode.com/problems/subsets
class Solution:
    def subsets(self, nums: List[int]) -> List[List[int]]:
        to_return = []
        def aux(lvl : int, curr : List[int], append):
            if lvl > len(nums):
                return
            if append:
                to_return.append(curr)
            if lvl < len(nums):
                aux(lvl+1, curr, False)
                aux(lvl+1, curr + [nums[lvl]], True)
        aux(0, [], True)
        return to_return
            