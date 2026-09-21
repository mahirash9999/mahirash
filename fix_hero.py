import re

with open('d:/Mahirash-Final/src/pages/Admin/components/HeroVideoManager.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace header banner
code = re.sub(r'bg-gradient-to-r from-zinc-900 via-zinc-900 to-black p-6 sm:p-8 rounded-2xl border border-zinc-800 shadow-xl text-white relative overflow-hidden',
              r'bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200 shadow-sm text-zinc-900 relative overflow-hidden', code)

code = re.sub(r'bg-emerald-500/10 text-emerald-400', r'bg-emerald-500/10 text-emerald-600', code)
code = re.sub(r'<h1 className="text-2xl sm:text-3xl font-light tracking-wide">Homepage Hero Video</h1>\n\s*<p className="text-sm text-zinc-400 max-w-xl">',
              r'<h1 className="text-2xl sm:text-3xl font-light tracking-wide">Homepage Hero Video</h1>\n            <p className="text-sm text-zinc-500 max-w-xl">', code)

# Replace cards wrappers
code = code.replace(r'bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md', r'bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm')
code = code.replace(r'bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl sticky top-8', r'bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm sticky top-8')

# Replace texts
code = code.replace(r'text-white', r'text-zinc-900')
code = code.replace(r'text-zinc-200', r'text-zinc-700')
code = code.replace(r'text-zinc-400', r'text-zinc-500')
code = code.replace(r'text-zinc-300', r'text-zinc-800')

# Replace borders
code = code.replace(r'border-zinc-800', r'border-zinc-200')

# Replace backgrounds for inputs and buttons
code = code.replace(r'bg-zinc-950 border border-zinc-200', r'bg-zinc-50 border border-zinc-200')
code = code.replace(r'bg-zinc-800', r'bg-zinc-100')
code = code.replace(r'bg-zinc-700', r'bg-zinc-200')
code = code.replace(r'bg-zinc-950/50', r'bg-zinc-50')
code = code.replace(r'bg-zinc-950/60', r'bg-zinc-50')
code = code.replace(r'bg-zinc-800/50', r'bg-zinc-100')
code = code.replace(r'bg-zinc-800/30', r'bg-zinc-100')

# Other
code = code.replace(r'text-emerald-400', r'text-emerald-600')
code = code.replace(r'text-blue-400', r'text-blue-600')
code = code.replace(r'text-purple-400', r'text-purple-600')

with open('d:/Mahirash-Final/src/pages/Admin/components/HeroVideoManager.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Replacement done!")
