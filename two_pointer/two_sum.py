#unsorted array:
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        to_find = {}
        for i, val in enumerate(nums):
            if val in to_find:
                return [to_find[val], i]
            to_find[target-val] = i


#sorted array:

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        nums_size = len(nums)
        j = nums_size-1
        i = 0
        while(i < j):
            num1 = nums[i]
            num2 = nums[j]
            if(num1+num2 == target):
                return [i+1,j+1]
            if(num1+num2 > target):
                j -= 1
            else:
                i += 1
        