setup-package:
	pip install virtualenv
	pip install build

build-package:
	python -m build

install:
	pip install -e .[dev]
