
import os

resume_builder_path = r"d:\nimesh-portfolio\ie-final app\interviewxpert-opencv\pages\ResumeBuilder.tsx"
ui_part_path = r"d:\nimesh-portfolio\ie-final app\interviewxpert-opencv\ui_part.tsx"

with open(resume_builder_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Extract lines up to line 557 (0-indexed 556)
# Line 558 in file (1-indexed) is index 557.
# We want up to index 557 (exclusive of the return statement line if it was strictly at 558)
# Let's check the context again. 
# Line 557 was empty. Line 558 was '  return ('. 
# So we want lines 0 to 557 (inclusive) which is 558 lines.
original_logic = lines[:557] 

with open(ui_part_path, 'r', encoding='utf-8') as f:
    new_ui = f.read()

# Combine
new_content = "".join(original_logic) + "\n" + new_ui

with open(resume_builder_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("ResumeBuilder.tsx updated successfully.")
