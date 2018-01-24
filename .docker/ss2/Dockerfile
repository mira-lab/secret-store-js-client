FROM ubuntu:16.04
MAINTAINER Andrey Tarasenko <andrey.installmonster@gmail.com>
ENV TERM xterm
WORKDIR /

RUN apt-get clean && apt-get -y update && apt-get install -y locales curl software-properties-common git \
  && locale-gen en_US.UTF-8

# install tools and dependencies
RUN apt-get update && \
	apt-get install -y \
	g++ \
	build-essential \
	curl \
	git \
	file \
	binutils \
	libssl-dev \
	pkg-config \
	libudev-dev \
	dnsutils \
	iputils-ping

## install rustup
#RUN curl https://sh.rustup.rs -sSf -y 0 | sh -s -- -y
#
## rustup directory
#ENV PATH /root/.cargo/bin:$PATH
#
## show backtraces
#ENV RUST_BACKTRACE 1
#
## show tools
#RUN rustc -vV && \
#cargo -V && \
#gcc -v &&\
#g++ -v

# build parity
#ADD . /build/parity
#RUN cd parity && \
#	cargo build --release --verbose && \
#	ls /build/parity/target/release/parity && \
#	strip /build/parity/target/release/parity
#
#RUN file /build/parity/target/release/parity


ADD endpoint.sh /endpoint.sh
RUN chmod 755 /endpoint.sh
ADD config.toml /config.toml

ADD bin/parity /parity
RUN chmod 755 /parity
ADD bin/libssl.so.1.1 /usr/lib/x86_64-linux-gnu/libssl.so.1.1
ADD bin/libcrypto.so.1.1 /usr/lib/x86_64-linux-gnu/libcrypto.so.1.1

#RUN usermod -u 1000 www-data


EXPOSE 8080 8082 8545 8180
#CMD ["/endpoint.sh"]

CMD [ "bash" ]
