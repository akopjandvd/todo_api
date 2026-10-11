"""Keep the original test check strict after conditional backend validation."""

import os


def completion_message(scope_result, run_full, backend_result):
    if scope_result != "success":
        raise ValueError("Scope validation failed or was cancelled.")
    if run_full == "false" and backend_result == "skipped":
        return "Vetted prose checks passed; backend tests intentionally not run."
    if run_full == "true" and backend_result == "success":
        return "Full backend tests passed."
    raise ValueError("Required backend validation did not pass.")


if __name__ == "__main__":
    message = completion_message(
        os.environ.get("SCOPE_RESULT"), os.environ.get("RUN_FULL"), os.environ.get("BACKEND_RESULT"),
    )
    print(message)
    with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as summary:
        summary.write(message + "\n")
