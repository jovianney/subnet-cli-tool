# Failures Log — Subnet CLI Tool

Real errors hit while building this tool, documented as they happened. Format: Problem → Diagnosis → Fix → Prevention.

---

## Failure 001 — Negative number in bitwise AND result

**Problem:**
`bitwiseAnd()` was supposed to output a clean 32-character binary string for the network address calculation. Instead, it printed something like:

```
0-111111010101111111111100000000
```

A `-` showed up in the middle of the string, and when converted back to dotted decimal it produced garbage (`0.87.255.0` instead of `192.168.1.0`).

**Diagnosis:**
JavaScript's bitwise operators (`&`, `|`, etc.) treat numbers as **signed 32-bit integers**. The leftmost bit of a 32-bit number isn't just data — JS reads it as a sign flag (positive vs. negative).

The IP `192.168.1.0` starts with `192`, which in binary is `11000000` — leading with a `1`. When that number went through the bitwise AND operation, JavaScript interpreted the result's leading `1` bit as a negative sign instead of part of the actual value. `.padStart(32, "0")` couldn't fix it because the string already contained a `-` character, throwing off the total length and the value itself.

**Fix:**
Applied the unsigned right shift trick — `(num1 & num2) >>> 0` — after the bitwise operation, before converting back to a binary string:

```js
function bitwiseAnd(binary1, binary2) {
  var num1 = parseInt(binary1, 2);
  var num2 = parseInt(binary2, 2);
  var result = (num1 & num2) >>> 0;
  return result.toString(2).padStart(32, "0");
}
```

Shifting right by 0 bits doesn't move any data, but it forces JavaScript to reinterpret the result as an **unsigned** integer — stripping the broken negative-sign interpretation and giving back the correct positive binary value.

Applied the same fix to `bitwiseOr()` preemptively, since it has the exact same signed-integer risk.

**Prevention:**
Any time bitwise math (`&`, `|`, `^`, `~`, shifts) is done in JavaScript on a value where the high bit could realistically be `1` — like IP address octets, which regularly start at 128+ — always tack on `>>> 0` immediately after the operation, before doing anything else with the result.

---

## Failure 002 — Usable host range included the network and broadcast addresses

**Problem:**
The tool's output was technically wrong — it listed the "Usable Host Range" as the network address through the broadcast address:

```
Usable Host Range:  192.168.1.0 - 192.168.1.255
```

Both of those addresses are reserved and can't actually be assigned to a device. The real usable range should start one address after the network address and end one address before the broadcast address.

**Diagnosis:**
The `calculateSubnet()` function was directly printing `networkAddress` and `broadcastAddress` in the range line instead of calculating the actual first and last *usable* addresses. This was a logic gap, not a syntax error — the code ran fine and produced a believable-looking (but incorrect) result, which is a more dangerous kind of bug than one that crashes outright.

**Fix:**
Added two new functions to calculate the true usable boundaries by doing the +1/-1 math in binary (as real numbers), not as strings:

```js
function firstUsable(networkBinary) {
  var num = parseInt(networkBinary, 2);
  var result = (num + 1) >>> 0;
  return result.toString(2).padStart(32, "0");
}

function lastUsable(broadcastBinary) {
  var num = parseInt(broadcastBinary, 2);
  var result = (num - 1) >>> 0;
  return result.toString(2).padStart(32, "0");
}
```

Wired both into `calculateSubnet()` and updated the printed range to use `firstUsableAddress` and `lastUsableAddress` instead of the raw network/broadcast values. Corrected output:

```
Usable Host Range:  192.168.1.1 - 192.168.1.254
```

**Prevention:**
When displaying a "usable" range for anything with reserved boundary values (subnetting, array bounds, date ranges, etc.), double check whether the boundary values themselves are meant to be included or excluded before shipping the output. A believable wrong answer is easy to miss without deliberately testing edge behavior — verifying against a known example (`192.168.1.0/24` is a well-documented standard case) caught it here.

---

## General Lesson

Both failures in this project came from the same root cause: JavaScript doing exactly what it was told, but the *logic* not accounting for a real-world edge case (signed integers at the bit level, and inclusive vs. exclusive ranges). Neither bug threw an error or crashed the program — both produced confident, wrong-looking-right output. That's a good reminder to verify results against a known/expected value, not just check that the code "ran without errors."
