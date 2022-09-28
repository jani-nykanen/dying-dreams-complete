# Change this before compiling!
CLOSURE_PATH := closure/closure.jar


.PHONY: js
js:
	mkdir -p js
	tsc -w src/main.ts --module es2020 --lib es2020,dom --target es2020 --outDir js

js_full:
	mkdir -p js
	tsc src/main.ts --module es2020 --lib es2020,dom --target es2020 --outDir js

server:
	python3 -m http.server

linecount:
	(cd src; find . -name '*.ts' | xargs wc -l)

dist:
	zip -r dist.zip js
	zip -r dist.zip assets
	zip -r dist.zip index.html

all: js
