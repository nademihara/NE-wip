import { expect, test } from "bun:test";
import { convert, InputError, parseMask } from "./netmask";

test("parseMask accepts dotted, slash and bare prefix forms", () => {
  expect(parseMask("255.255.255.0")).toBe(24);
  expect(parseMask("/24")).toBe(24);
  expect(parseMask("30")).toBe(30);
  expect(parseMask("0.0.0.0")).toBe(0);
  expect(parseMask("255.255.255.255")).toBe(32);
});

test("parseMask rejects non-contiguous and out of range masks", () => {
  expect(parseMask("255.0.255.0")).toBeNull();
  expect(parseMask("33")).toBeNull();
  expect(parseMask("255.255.255.256")).toBeNull();
});

test("convert returns the wildcard and host count", () => {
  const r = convert("255.255.255.252");
  expect(r.wildcard).toBe("0.0.0.3");
  expect(r.hosts).toBe(2);
  expect(r.commands).toEqual([]);
});

test("convert normalizes host bits and builds commands", () => {
  const r = convert("/30", "10.0.0.5");
  expect(r.network).toBe("10.0.0.4");
  expect(r.warning).toContain("10.0.0.4");
  expect(r.commands[0]).toBe("access-list 10 permit 10.0.0.4 0.0.0.3");
  expect(r.commands[2]).toBe("router ospf 1\n network 10.0.0.4 0.0.0.3 area 0");
});

test("convert uses host and any keywords for /32 and /0", () => {
  expect(convert("32", "1.2.3.4").commands[0]).toBe("access-list 10 permit host 1.2.3.4");
  expect(convert("0", "1.2.3.4").commands[0]).toBe("access-list 10 permit any");
});

test("convert throws InputError on bad input", () => {
  expect(() => convert("255.0.255.0")).toThrow(InputError);
  expect(() => convert("24", "1.2.3")).toThrow(InputError);
});
