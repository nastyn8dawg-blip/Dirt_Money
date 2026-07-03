"""Calculates every formula in economy_model.xlsx with the `formulas` engine
(no Excel/LibreOffice needed) and fails on any Excel error value.
Prints the Comparison-sheet verdicts so the Phase 0 exit criterion is machine-checked.
"""
import sys
import formulas

XL = r"C:\dev\Dirt_Money\design\economy_model.xlsx"
ERRORS = ("#REF!", "#DIV/0!", "#VALUE!", "#N/A", "#NAME?", "#NULL!", "#NUM!")

xl = formulas.ExcelModel().loads(XL).finish()
sol = xl.calculate()

bad = []
vals = {}
for key, cell in sol.items():
    try:
        v = cell.value[0, 0]
    except Exception:
        continue
    vals[key.upper()] = v
    if isinstance(v, str) and v.strip().upper() in ERRORS:
        bad.append((key, v))

if bad:
    print("FORMULA ERRORS FOUND:")
    for k, v in bad:
        print(" ", k, v)
    sys.exit(1)

def get(sheet, ref):
    return vals.get(f"'[ECONOMY_MODEL.XLSX]{sheet.upper()}'!{ref}")

print("zero formula errors across", len(vals), "cells")
print()
print(f"{'':28}{'Old School':>14}{'IT Nephew':>14}{'Mechanic':>14}")
rows = [("End cash", "B5", "C5", "D5"), ("End debt", "B6", "C6", "D6"),
        ("Net worth delta", "B7", "C7", "D7"), ("Top income source", "B8", "C8", "D8")]
for label, *refs in rows:
    out = f"{label:28}"
    for r in refs:
        v = get("Comparison", r)
        out += f"{v if isinstance(v, str) else round(v):>14}" if v is not None else f"{'?':>14}"
    print(out)
print()
for label, ref in [("All solvent", "B17"), ("All improved net worth", "B18"),
                   ("Top sources all different", "B19"), ("Balance fairness <=1.25x", "B20")]:
    print(f"CHECK {label:30} {get('Comparison', ref)}")
