#!/bin/sh

unset $CDPATH

name="maxkl.de"
dir=/home/max/maxkl.de
script=server/app.js
logdir=${dir}/logs

forever start --uid ${name} -l ${logdir}/forever.log -o ${logdir}/stdout.log -e ${logdir}/stderr.log --sourceDir ${dir} --workingDir ${dir} -a ${script}
