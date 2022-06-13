import hashlib
import json
import os
import shutil
import subprocess
from typing import Dict, List, Optional

from scripts.lib.zulip_tools import run

ZULIP_PATH = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ZULIP_SRV_PATH = "/srv"

NODE_MODULES_CACHE_PATH = os.path.join(ZULIP_SRV_PATH, "zulip-npm-cache")
YARN_BIN = os.path.join(ZULIP_SRV_PATH, "zulip-yarn/bin/yarn")
YARN_PACKAGE_JSON = os.path.join(ZULIP_SRV_PATH, "zulip-yarn/package.json")

DEFAULT_PRODUCTION = False


def get_yarn_args(production: bool) -> List[str]:
    if production:
        yarn_args = ["--prod"]
    else:
        yarn_args = []
    return yarn_args


def generate_sha1sum_node_modules(
    setup_dir: Optional[str] = None,
    production: bool = DEFAULT_PRODUCTION,
) -> str:
    if setup_dir is None:
        setup_dir = os.path.realpath(os.getcwd())
    PACKAGE_JSON_FILE_PATH = os.path.join(setup_dir, "package.json")
    YARN_LOCK_FILE_PATH = os.path.join(setup_dir, "yarn.lock")
    data: Dict[str, object] = {}
    with open(PACKAGE_JSON_FILE_PATH) as f:
        data[PACKAGE_JSON_FILE_PATH] = f.read().strip()
    if os.path.exists(YARN_LOCK_FILE_PATH):
        # For backwards compatibility, we can't assume yarn.lock exists
        with open(YARN_LOCK_FILE_PATH) as f:
            data[YARN_LOCK_FILE_PATH] = f.read().strip()
    with open(YARN_PACKAGE_JSON) as f:
        data["yarn-package-version"] = json.load(f)["version"]
    data["node-version"] = subprocess.check_output(["node", "--version"], text=True).strip()
    data["yarn-args"] = get_yarn_args(production=production)

    sha1sum = hashlib.sha1()
    sha1sum.update(json.dumps(data, sort_keys=True).encode())
    return sha1sum.hexdigest()


def setup_node_modules(
    production: bool = DEFAULT_PRODUCTION,
    prefer_offline: bool = False,
) -> None:
    yarn_args = get_yarn_args(production=production)
    if prefer_offline:
        yarn_args.append("--prefer-offline")
    sha1sum = generate_sha1sum_node_modules(production=production)
    target_path = os.path.join(NODE_MODULES_CACHE_PATH, sha1sum)
    cached_node_modules = os.path.join(target_path, "node_modules")
    success_stamp = os.path.join(target_path, ".success-stamp")
    # Check if a cached version already exists
    if not os.path.exists(success_stamp):
        do_yarn_install(target_path, yarn_args, success_stamp)

    print(f"Using cached node modules from {cached_node_modules}")
    if os.path.islink("node_modules"):
        os.remove("node_modules")
    elif os.path.isdir("node_modules"):
        shutil.rmtree("node_modules")
    os.symlink(cached_node_modules, "node_modules")


def do_yarn_install(
    target_path: str,
    yarn_args: List[str],
    success_stamp: str,
) -> None:
    os.makedirs(target_path, exist_ok=True)
    shutil.copy("package.json", target_path)
    shutil.copy("yarn.lock", target_path)
    shutil.copy(".yarnrc", target_path)
    cached_node_modules = os.path.join(target_path, "node_modules")
    print("Cached version not found! Installing node modules.")

    # Copy the existing node_modules to speed up install
    if os.path.exists("node_modules") and not os.path.exists(cached_node_modules):
        shutil.copytree("node_modules/", cached_node_modules, symlinks=True)
        if os.path.isdir(os.path.join(cached_node_modules, ".cache")):
            shutil.rmtree(os.path.join(cached_node_modules, ".cache"))
    if os.environ.get("CUSTOM_CA_CERTIFICATES"):
        run([YARN_BIN, "config", "set", "cafile", os.environ["CUSTOM_CA_CERTIFICATES"]])
    run(
        [YARN_BIN, "install", "--non-interactive", "--frozen-lockfile", *yarn_args], cwd=target_path
    )
    with open(success_stamp, "w"):
        pass
