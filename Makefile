build:
	sudo docker-compose build
down:
	sudo docker-compose down
up:
	sudo docker-compose up
clear:
	sudo rm -rf .docker/php/logs/php/*
	sudo rm -rf .docker/php/logs/runtime/*

	sudo rm -rf .docker/mariadb/logs/*
	sudo rm -rf .docker/mariadb/data/*

	sudo rm -rf .docker/mongodb/logs/*
	sudo rm -rf .docker/mongodb/data/*

	sudo rm -rf .docker/minexcoin/data/*
	sudo rm -rf .docker/apiDoc/data/*
	sudo rm -rf .docker/nginx/logs/*


	sudo rm -rf app/vendor/*
	sudo rm -rf app/storage/runtime/*

dump:
	sudo docker-compose exec db mysql_dump -u test -p test > dump.sql

apidoc:
	sudo docker-compose run apidoc yarn apidoc

migrate:
	sudo docker-compose exec php php bin/yii migrate

models:
	sudo docker-compose exec php php bin/yii gii/model --tableName=* --interactive=0 --overwrite=1
fix-permission:
	sudo chown -R $(shell whoami):$(shell whoami) .docker/
	sudo chown -R $(shell whoami):$(shell whoami) *
	sudo chmod -R 0755 *
	sudo chmod -R 0755 .docker/

	sudo chmod -R 0777 .docker/mariadb/initdb/*
	sudo chmod -R 0777 .docker/mongodb/initdb/*
