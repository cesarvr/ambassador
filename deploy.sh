oc start-build bc/decorator --from-dir=. --follow
oc set env -c decorator dc/j-slow TARGET_PORT=8080 PORT=8087 MOTHERSHIP=http://dashboard-hello.192.168.64.2.nip.io
