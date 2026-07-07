function parseInput(input) {
  var parts = input.split("/");
  var ip = parts[0];
  var cidr = parseInt(parts[1]);
  return { ip: ip, cidr: cidr };
}

function octetToBinary(octet) {
  var num = parseInt(octet);
  var binary = num.toString(2);
  var padded = binary.padStart(8, "0");
  return padded;
}

function ipToBinary(ip) {
  var octets = ip.split(".");
  var binaryOctets = [];

  for (var i = 0; i < octets.length; i++) {
    binaryOctets.push(octetToBinary(octets[i]));
  }

  return binaryOctets.join("");
}

function cidrToMaskBinary(cidr) {
  var mask = "";

  for (var i = 0; i < 32; i++) {
    if (i < cidr) {
      mask += "1";
    } else {
      mask += "0";
    }
  }

  return mask;
}

function binaryToDotted(binary) {
  var octets = [];

  for (var i = 0; i < 4; i++) {
    var chunk = binary.substring(i * 8, i * 8 + 8);
    var num = parseInt(chunk, 2);
    octets.push(num);
  }

  return octets.join(".");
}

function bitwiseAnd(binary1, binary2) {
  var num1 = parseInt(binary1, 2);
  var num2 = parseInt(binary2, 2);
  var result = (num1 & num2) >>> 0;
  return result.toString(2).padStart(32, "0");
}

function bitwiseOr(binary1, binary2) {
  var num1 = parseInt(binary1, 2);
  var num2 = parseInt(binary2, 2);
  var result = (num1 | num2) >>> 0;
  return result.toString(2).padStart(32, "0");
}

function flipMask(mask) {
  var flipped = "";
  for (var i = 0; i < mask.length; i++) {
    if (mask[i] === "1") {
      flipped += "0";
    } else {
      flipped += "1";
    }
  }
  return flipped;
}

function usableHosts(cidr) {
  var hostBits = 32 - cidr;
  var total = Math.pow(2, hostBits);
  return total - 2;
}

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

function calculateSubnet(input) {
  var parsed = parseInput(input);
  var ip = parsed.ip;
  var cidr = parsed.cidr;

  var ipBinary = ipToBinary(ip);
  var maskBinary = cidrToMaskBinary(cidr);
  var wildcardBinary = flipMask(maskBinary);

  var networkBinary = bitwiseAnd(ipBinary, maskBinary);
  var broadcastBinary = bitwiseOr(ipBinary, wildcardBinary);

  var firstUsableBinary = firstUsable(networkBinary);
  var lastUsableBinary = lastUsable(broadcastBinary);

  var networkAddress = binaryToDotted(networkBinary);
  var broadcastAddress = binaryToDotted(broadcastBinary);
  var subnetMask = binaryToDotted(maskBinary);
  var firstUsableAddress = binaryToDotted(firstUsableBinary);
  var lastUsableAddress = binaryToDotted(lastUsableBinary);
  var totalUsable = usableHosts(cidr);

  console.log("Input:              " + input);
  console.log("Network Address:    " + networkAddress);
  console.log("Broadcast Address:  " + broadcastAddress);
  console.log("Subnet Mask:        " + subnetMask);
  console.log("Usable Host Range:  " + firstUsableAddress + " - " + lastUsableAddress);
  console.log("Total Usable Hosts: " + totalUsable);
}

calculateSubnet("192.168.1.0/24");
calculateSubnet("10.0.0.0/8");