setup-package:
	pip install virtualenv
	pip install build

build-package:
	make setup-package
	python -m build

install:
	pip install -e .[dev]
