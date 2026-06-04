import os
import shutil

file_path = "/opt/taxandpurpose/build/static/js/main.d3363160.js"
backup_path = file_path + ".bak"

# Restore original file from backup if it exists to start fresh
if os.path.exists(backup_path):
    shutil.copyfile(backup_path, file_path)
    print("Restored clean file from backup.")
else:
    shutil.copyfile(file_path, backup_path)
    print("Fresh backup created.")

with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

print("Re-evaluating strict component boundary targets...")

# Bulletproof anchor strings found directly in your terminal snippets
about_start = '(0,rr.jsx)("section",{id:"about"'
beratung_start = 'children:t.beratungsformate.tag'
workshops_start = 'children:t.workshops.tag'
blog_start = '(0,rr.jsx)(Cr,{t:t,lang:n})'

# Find core layout points
idx_about = code.find(about_start)

# Find the exact opening of Beratungsformate section right before its tag lookup
idx_beratung_tag = code.find(beratung_start)
idx_beratung = code.rfind('(0,rr.jsx)("section",', idx_about, idx_beratung_tag)

# Find the exact opening of Workshops section right before its tag lookup
idx_workshops_tag = code.find(workshops_start)
idx_workshops = code.rfind('(0,rr.jsx)("section",', idx_beratung, idx_workshops_tag)

idx_blog = code.find(blog_start)

print(f"Coordinates found -> About: {idx_about}, Beratung: {idx_beratung}, Workshops: {idx_workshops}, Blog: {idx_blog}")

if -1 in [idx_about, idx_beratung, idx_workshops, idx_blog]:
    print("Error: Boundary target markers misaligned. Let's dump diagnostic positions.")
    exit(1)

# Slice layout data blocks cleanly
about_chunk = code[idx_about:idx_beratung]
beratung_chunk = code[idx_beratung:idx_workshops]
workshops_chunk = code[idx_workshops:idx_blog]

print("Swapping background layers to maintain zebra pattern...")
# 1. Shift Beratungsformate to top layout slot -> set background tint to soft red (bg-background)
beratung_chunk = beratung_chunk.replace('bg-white overflow-hidden"', 'bg-background overflow-hidden"')

# 2. Shift Workshops to middle layout slot -> set background tint to pure white (bg-white)
workshops_chunk = workshops_chunk.replace('bg-background overflow-hidden"', 'bg-white overflow-hidden"')

# 3. About chunk moves behind workshops and automatically stays soft red (bg-background)

# Reassemble file in the requested structural order
new_code = (
    code[:idx_about] + 
    beratung_chunk + 
    workshops_chunk + 
    about_chunk + 
    code[idx_blog:]
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_code)

print("🎉 Success! Components re-ordered and background colors synced.")
