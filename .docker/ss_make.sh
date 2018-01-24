sudo mount --bind ~/PHP/ethereumjs-devp2p/.docker/parity/ ~/PHP/ethereumjs-devp2p/.docker/ss/bin

sudo mount --bind ~/PHP/ethereumjs-devp2p/.docker/parity/ ~/PHP/parity-deploy/deployment/1/bin

docker network create --subnet=172.15.0.0/16 mynet124

cd ~/PHP/ethereumjs-devp2p/.docker/
docker build -t parity/ss_cmd .docker/ss
docker run -dit parity/ss_cmd:latest --net=mynet124 --ip=172.15.0.5
