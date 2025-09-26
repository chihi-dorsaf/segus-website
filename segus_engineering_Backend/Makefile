lint:
	flake8 .
	ruff check . || true
	isort --check-only .
	black --check .

format:
	isort .
	black .

test:
	pytest

coverage:
	coverage run -m pytest && coverage report -m





