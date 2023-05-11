setup-package:
	pip install virtualenv
	pip install build

build-package:
	make setup-package
	cp README.md skyagi
	cd skyagi && python -m build

install:
	cd skyagi && pip install -e .[dev]

setup-dev:
	cp scripts/pre-commit .git/hooks
	cp scripts/pre-push .git/hooks

lint:
	flake8 .

format:
	cd skyagi && isort . && black .
	cd skyagi-api && isort . && black .

format-staged-files:
	echo "Auto-formatting not implemented"
