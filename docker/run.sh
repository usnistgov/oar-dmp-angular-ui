#! /bin/bash
#
# run.sh -- build and optionally test the software in this repo via docker
#
# type "run.sh -h" to see detailed help
#
prog=`basename $0`
execdir=`dirname $0`
[ "$execdir" = "" -o "$execdir" = "." ] && execdir=$PWD
codedir=`(cd $execdir/.. > /dev/null 2>&1; pwd)`
os=`uname`
SED_RE_OPT=r
[ "$os" != "Darwin" ] || SED_RE_OPT=E

function usage {
    cat <<EOF

$prog - build and optionally test the software in this repo via docker

SYNOPSIS
  $prog [-d|--docker-build] [--dist-dir DIR] [CMD ...] 
        [DISTNAME|angular ...] 
        

ARGS:
  angular   apply commands to just the angular distributions

DISTNAMES:  dmp-ui

CMDs:
  build     build the software
  test      build the software and run the unit tests
  install   just install the prerequisites (use with shell)
  shell     start a shell in the docker container used to build and test

OPTIONS
  -d        build the required docker containers first
  -t TESTCL include the TESTCL class of tests when testing; as some classes
            of tests are skipped by default, this parameter provides a means 
            of turning them on.
EOF
}

function wordin {
    word=$1
    shift

    echo "$@" | grep -qsw "$word"
}
function docker_images_built {
    for image in "$@"; do
        (docker images | grep -qs $image) || {
            return 1
        }
    done
    return 0
}

set -e

distvol=
distdir=
dodockbuild=
cmds=
comptypes=
args=()
dargs=()
pyargs=()
angargs=()
jargs=()
testcl=()
while [ "$1" != "" ]; do
    case "$1" in
        -d|--docker-build)
            dodockbuild=1
            ;;
        --dist-dir)
            shift
            distdir="$1"
            mkdir -p $distdir
            distdir=`(cd $distdir > /dev/null 2>&1; pwd)`
            distvol="-v ${distdir}:/app/dist"
            args=(${args[@]} "--dist-dir=/app/dist")
            ;;
        --dist-dir=*)
            distdir=`echo $1 | sed -e 's/[^=]*=//'`
            mkdir -p $distdir
            distdir=`(cd $distdir > /dev/null 2>&1; pwd)`
            distvol="-v ${distdir}:/app/dist"
            args=(${args[@]} "--dist-dir=/app/dist")
            ;;
        -t|--incl-tests)
            shift
            testcl=(${testcl[@]} $1)
            ;;
        --incl-tests=*)
            testcl=(${testcl[@]} `echo $1 | sed -e 's/[^=]*=//'`)
            ;;
        -h|--help)
            usage
            exit
            ;;
        -*)
            args=(${args[@]} $1)
            ;;
        angular|dmp-ui)
            wordin dmp-ui $comptypes || comptypes="$comptypes dmp-ui"
            angargs=(${args[@]} $1)
            ;;
        build|install|test|shell)
            cmds="$cmds $1"
            ;;
        *)
            echo Unsupported command: $1
            false
            ;;
    esac
    shift
done

[ -z "$distvol" ] || dargs=(${dargs[@]} "$distvol")
[ -z "${testcl[@]}" ] || {
    dargs=(${dargs[@]} --env OAR_TEST_INCLUDE=\"${testcl[@]}\")
}
bargs=""
# if [ -z "$HTTPS_PROXY" ]; then
#     bargs="--build-arg=https_proxy=$HTTPS_PROXY"
# fi

comptypes=`echo $comptypes`
cmds=`echo $cmds`
[ -n "$comptypes" ] || comptypes="dmp-ui"
[ -n "$cmds" ] || cmds="build"
echo "run.sh: Running docker commands [$cmds] on [$comptypes]"

testopts="--cap-add SYS_ADMIN"
volopt="-v ${codedir}:/dev/oar-dmp-angular-ui"

# check to see if we need to build the docker images; this can't detect
# changes requiring re-builds.
# 
if [ -z "$dodockbuild" ]; then
    if wordin dmp-ui $comptypes; then
        if wordin build $cmds; then
            docker_images_built oar-dmp-angular-ui/dmp-ui|| dodockbuild=1
        fi
    fi
fi

        
[ -z "$dodockbuild" ] || {
    echo '#' Building missing docker containers...
    $execdir/dockbuild.sh
}

# build distributions, if requested
#
if wordin build $cmds; then
    echo '+' docker run --rm $volopt "${dargs[@]}" oar-dmp-angular-ui/dmp-ui \
                    build "${args[@]}" $dists
    docker run --rm $volopt "${dargs[@]}" oar-dmp-angular-ui/dmp-ui \
           build "${args[@]}" $dists
fi

# run tests, if requested
#
if wordin test $cmds; then
    # not yet supported
    echo '#' test command not yet implemented
#    echo '+' docker run --rm $volopt "${dargs[@]}" oar-dmp-angular-ui/dmp-ui \
#                    test "${args[@]}" $dists
#    docker run --rm $volopt "${dargs[@]}" oar-dmp-angular-ui/dmp-ui \
#           test "${args[@]}" $dists
fi

# open a shell, if requested
#
if wordin shell $cmds; then
    echo '+' docker run -ti --rm $volopt "${dargs[@]}"  \
                    oar-dmp-angular-ui/dmp-ui shell "${args[@]}"
    docker run --rm -ti $volopt "${dargs[@]}" oar-dmp-angular-ui/dmp-ui \
           shell "${args[@]}"
fi

