setup-package:
	pip install virtualenv
	pip install build

build-package:
	make setup-package
	python -m build

install:
	pip install -e .[dev]

setup-dev:
	cp scripts/pre-commit .git/hooks
	cp scripts/pre-push .git/hooks

lint:
	echo "Linting not implemented"

format-staged-files:
	echo "Auto-formatting not implemented"
