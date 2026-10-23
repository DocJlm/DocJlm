"""Deterministic, offline ReAct-style demonstration; never calls a remote model."""
import argparse
import asyncio
import json
from dataclasses import dataclass


@dataclass
class Action:
    name: str
    done: bool = False
    answer: str = ""


class Harness:
    def __init__(self, failures=1, max_retries=1):
        self.failures = failures
        self.max_retries = max_retries
        self.calls = 0
        self.retries = 0
        self.retry_on_timeout = False
        self.events = []

    def start(self, task):
        state = {"task": task, "observations": []}
        self.events.append({"at": 0, "type": "decide", "message": "Select tools.run"})
        return state

    async def execute(self, action):
        if action.name == "repair":
            self.retry_on_timeout = True
            self.events.append({"at": 7, "type": "repair", "message": "Apply bounded retry policy"})
            return {"ok": True, "kind": "patch"}
        self.calls += 1
        retry = self.calls > 1
        if retry:
            if self.retries >= self.max_retries:
                return {"ok": False, "kind": "exhausted"}
            self.retries += 1
        self.events.append({"at": 13 if retry else 3, "type": "call", "message": "tools.run(task)"})
        if self.calls <= self.failures:
            result = {"ok": False, "kind": "timeout"}
            self.events.append({"at": 14 if retry else 5, "type": "timeout", "message": "ToolTimeout"})
        else:
            result = {"ok": True, "kind": "result"}
            self.events.append({"at": 16 if retry else 5, "type": "verified", "message": "PASS test_tool_retry"})
        return result

    def observe(self, state, result):
        state["observations"].append(result)
        return state

    def checkpoint(self, state):
        last = state["observations"][-1] if state["observations"] else {}
        status = "verified" if last.get("kind") == "result" else "needs_attention"
        self.events.append({"at": 21, "type": "checkpoint", "message": status})
        return {"status": status, "calls": self.calls, "retries": self.retries,
                "patched": self.retry_on_timeout, "state": state, "events": self.events}


class ScriptedAgent:
    def __init__(self, harness):
        self.harness = harness

    async def decide(self, state):
        observations = state["observations"]
        if not observations:
            return Action("tool")
        result = observations[-1]
        if result["kind"] == "result":
            return Action("finish", True, "Patch verified")
        if result["kind"] == "timeout":
            if self.harness.retry_on_timeout or self.harness.max_retries == 0:
                return Action("stop", True, "Needs attention")
            return Action("repair")
        return Action("tool")


async def run(task, harness, agent):
    state = harness.start(task)
    for _ in range(8):
        action = await agent.decide(state)
        if action.done:
            break
        result = await harness.execute(action)
        state = harness.observe(state, result)
    return harness.checkpoint(state)


def demo(failures=1, max_retries=1):
    harness = Harness(failures=failures, max_retries=max_retries)
    return asyncio.run(run("Repair a timed-out tool call", harness, ScriptedAgent(harness)))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--failures", type=int, default=1)
    parser.add_argument("--max-retries", type=int, default=1)
    args = parser.parse_args()
    print(json.dumps(demo(args.failures, args.max_retries), indent=2))
