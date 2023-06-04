setup-package:
	pip install virtualenv
	pip install build

build-package:
	make setup-package
	python -m build

upload-package:
	python -m twine upload dist/*

install:
	pip install -e .[dev]
