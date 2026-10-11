"""Fail closed unless the complete event diff contains only vetted prose."""

import json
import os
from pathlib import Path
import re
import subprocess


PROSE_PATHS = {"README.md", "todo-frontend/README.md"}
SHA = re.compile(r"[0-9a-f]{40}")


def git(repository, *arguments):
    return subprocess.run(
        ["git", "-C", str(repository), *arguments],
        check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30,
    ).stdout


def classify(repository, event_name, event, checkout_sha=None):
    full = {"run_full": True, "reason": "Unproven scope; full validation required."}
    try:
        if event_name == "pull_request":
            base = event["pull_request"]["base"]["sha"]
            head = event["pull_request"]["head"]["sha"]
        elif event_name == "push":
            base, head = event["before"], event["after"]
        else:
            return full
        if any(not isinstance(sha, str) or not SHA.fullmatch(sha)
               or sha == "0" * 40 for sha in (base, head)):
            return full
        if git(repository, "rev-parse", "--is-shallow-repository").strip() != b"false":
            return full
        actual_head = git(repository, "rev-parse", "HEAD").decode("ascii").strip()
        if checkout_sha and actual_head != checkout_sha:
            return full
        for sha in (base, head):
            git(repository, "cat-file", "-e", f"{sha}^{{commit}}")
        if event_name == "push":
            if actual_head != head:
                return full
        else:
            for sha in (base, head):
                git(repository, "merge-base", "--is-ancestor", sha, actual_head)
            bases = git(repository, "merge-base", "--all", base, head).decode("ascii").splitlines()
            if len(bases) != 1 or not SHA.fullmatch(bases[0]):
                return full
            base = bases[0]
        raw = git(repository, "diff", "--name-status", "-z", "--find-renames", base, head, "--")
        if not raw or not raw.endswith(b"\0"):
            return full
        fields = raw[:-1].decode("utf-8", errors="strict").split("\0")
        if len(fields) % 2 or any(
            fields[index] not in {"A", "M", "D"} or fields[index + 1] not in PROSE_PATHS
            for index in range(0, len(fields), 2)
        ):
            return full
        return {
            "run_full": False, "reason": "Complete event diff contains vetted prose only.",
            "base": base, "head": head, "changed_files": len(fields) // 2,
            "documents": [(fields[i], fields[i + 1]) for i in range(0, len(fields), 2)],
        }
    except (KeyError, TypeError, ValueError, UnicodeError, OSError, subprocess.SubprocessError):
        return full


def validate_documents(repository, decision):
    git(repository, "diff", "--check", decision["base"], decision["head"], "--")
    for status, path in decision["documents"]:
        if status != "D":
            document = git(repository, "show", f"{decision['head']}:{path}").decode("utf-8", errors="strict")
            if "\0" in document or re.search(r"(?m)^(<<<<<<< |>>>>>>> )", document):
                raise ValueError("A changed document contains binary data or conflict markers.")


def main():
    repository = Path(__file__).resolve().parents[2]
    try:
        event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text(encoding="utf-8"))
    except (KeyError, ValueError, OSError):
        event = {}
    decision = classify(repository, os.environ.get("GITHUB_EVENT_NAME"), event, os.environ.get("GITHUB_SHA"))
    if not decision["run_full"]:
        validate_documents(repository, decision)
    print(decision["reason"])
    with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as output:
        output.write(f"run_full={str(decision['run_full']).lower()}\n")
    with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as summary:
        summary.write(f"CI scope: {decision['reason']}\n\n")
        if not decision["run_full"]:
            summary.write("Document consistency checks passed; application tests were intentionally not run.\n")


if __name__ == "__main__":
    main()
