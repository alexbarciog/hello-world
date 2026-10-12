# Blog automation

Writes and publishes articles to intentsly.com/blog. Not part of the website build.

- `RUN.md`: what a daily run does, and the rules it must follow.
- `skills/blog-write.md`: how an article is researched and written.
- `scripts/blog_gate.py`: the checks every article must pass before it is published.
- `blog/keywords.json`: the queue. `blog/published/`: what is live. `blog/last-run.md`: latest report.
- `brain/`: product facts and verified proof the articles may use.
- `config/blog.json`: author, pace and limits.

Stop all publishing: add an empty file named `PAUSE` to this folder.
