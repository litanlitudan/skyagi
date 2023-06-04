setup-package:
	pip install virtualenv
	pip install build
	pip install twine

build-package:
	make setup-package
	python -m build

upload-package:
	python -m twine upload dist/*

install:
	pip install -e .[dev]
