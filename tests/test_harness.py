import asyncio
import importlib.util
import sys
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('harness_demo', Path(__file__).resolve().parents[1] / 'scripts/harness_demo.py')
demo = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = demo
spec.loader.exec_module(demo)


class HarnessTests(unittest.TestCase):
    def test_failure_repair_retry_success_is_real_local_execution(self):
        result = demo.demo()
        self.assertEqual((result['calls'], result['retries'], result['patched'], result['status']), (2, 1, True, 'verified'))
        self.assertEqual([e['type'] for e in result['events']], ['decide', 'call', 'timeout', 'repair', 'call', 'verified', 'checkpoint'])
        self.assertEqual([e['at'] for e in result['events']], [0, 3, 5, 7, 13, 16, 21])

    def test_permanent_failure_never_claims_success(self):
        result = demo.demo(failures=100)
        self.assertEqual((result['calls'], result['retries'], result['status']), (2, 1, 'needs_attention'))
        self.assertNotIn('verified', [e['type'] for e in result['events']])

    def test_retry_disabled_stops_after_first_failure(self):
        result = demo.demo(failures=1, max_retries=0)
        self.assertEqual((result['calls'], result['retries'], result['patched']), (1, 0, False))
        self.assertEqual(result['status'], 'needs_attention')

    def test_success_without_failure_does_not_invent_a_repair(self):
        result = demo.demo(failures=0)
        self.assertEqual((result['calls'], result['retries'], result['patched']), (1, 0, False))
        self.assertEqual(result['status'], 'verified')

    def test_unfinished_agent_stops_at_eight_decisions(self):
        class RepeatingAgent:
            async def decide(self, state):
                return demo.Action('repair')
        harness = demo.Harness()
        result = asyncio.run(demo.run('unfinished', harness, RepeatingAgent()))
        self.assertEqual(len(result['state']['observations']), 8)
        self.assertEqual(result['status'], 'needs_attention')


if __name__ == '__main__':
    unittest.main()
