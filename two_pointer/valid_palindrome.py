class Solution:
    
    def isPalindrome(self, s: str) -> bool:
        def is_alpha(ch):
            return (ord("A") <= ord(ch) <= ord("Z") or
            ord("a") <= ord(ch) <= ord("z") or
            ord("0") <= ord(ch) <= ord("9"))
        i = 0
        j = len(s)-1
        while (i < j):
            right = s[j]
            left = s[i]
            if not is_alpha(left):
                i += 1
                continue
            if not is_alpha(right):
                j -= 1
                continue

            if left.lower() != right.lower():
                return False
            i += 1
            j -= 1

        return True
        