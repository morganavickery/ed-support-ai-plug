function escapeForAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function renderPage(defaultServiceBaseUrl: string): string {
  const injectedServiceBaseUrl = escapeForAttribute(defaultServiceBaseUrl);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ed-support-ai-plug demo host</title>
    <style>
      :root {
        --bg: #f4efe7;
        --panel: rgba(255, 251, 245, 0.88);
        --panel-strong: #fffdf8;
        --ink: #1f1d1a;
        --muted: #6b6257;
        --accent: #0d6b63;
        --accent-soft: #d5efe8;
        --line: rgba(40, 32, 21, 0.12);
        --warning: #8a4b10;
        --danger: #8e2c2c;
        --shadow: 0 18px 45px rgba(38, 31, 22, 0.12);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(24, 123, 110, 0.18), transparent 32%),
          radial-gradient(circle at bottom right, rgba(180, 128, 47, 0.12), transparent 28%),
          linear-gradient(180deg, #f7f2ea 0%, #efe8dd 100%);
      }

      .shell {
        width: min(1320px, calc(100% - 32px));
        margin: 24px auto 48px;
      }

      .hero {
        padding: 28px 28px 20px;
        border: 1px solid var(--line);
        border-radius: 24px;
        background: var(--panel);
        box-shadow: var(--shadow);
        backdrop-filter: blur(14px);
      }

      .hero h1 {
        margin: 0 0 8px;
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
        font-size: clamp(2rem, 4vw, 3.25rem);
        line-height: 1.05;
      }

      .hero p {
        margin: 0;
        max-width: 820px;
        color: var(--muted);
        font-size: 1rem;
        line-height: 1.55;
      }

      .hero-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        justify-content: space-between;
        margin-top: 18px;
      }

      .status {
        padding: 10px 14px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: var(--panel-strong);
        color: var(--muted);
        font-size: 0.95rem;
      }

      .status[data-kind="success"] {
        color: var(--accent);
        border-color: rgba(13, 107, 99, 0.28);
      }

      .status[data-kind="error"] {
        color: var(--danger);
        border-color: rgba(142, 44, 44, 0.28);
      }

      .layout {
        display: grid;
        grid-template-columns: 420px minmax(0, 1fr);
        gap: 20px;
        margin-top: 20px;
      }

      .stack {
        display: grid;
        gap: 16px;
      }

      .panel {
        border: 1px solid var(--line);
        border-radius: 22px;
        background: var(--panel);
        box-shadow: var(--shadow);
        padding: 18px;
      }

      .panel h2 {
        margin: 0 0 6px;
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
        font-size: 1.35rem;
      }

      .panel p {
        margin: 0 0 14px;
        color: var(--muted);
        line-height: 1.45;
      }

      .field-grid {
        display: grid;
        gap: 12px;
      }

      .field-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      label {
        display: grid;
        gap: 6px;
        font-size: 0.92rem;
        color: var(--muted);
      }

      input,
      select,
      textarea,
      button {
        font: inherit;
      }

      input,
      select,
      textarea {
        width: 100%;
        border: 1px solid rgba(39, 31, 24, 0.16);
        border-radius: 14px;
        padding: 11px 13px;
        background: rgba(255, 255, 255, 0.88);
        color: var(--ink);
      }

      textarea {
        min-height: 88px;
        resize: vertical;
      }

      .code-area {
        min-height: 140px;
        font-family: "SFMono-Regular", "Menlo", monospace;
        font-size: 0.9rem;
      }

      .button-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      button {
        border: 0;
        border-radius: 999px;
        padding: 11px 16px;
        cursor: pointer;
        background: var(--accent);
        color: white;
        transition: transform 120ms ease, opacity 120ms ease;
      }

      button.secondary {
        background: #f2eadf;
        color: var(--ink);
        border: 1px solid var(--line);
      }

      button:hover {
        transform: translateY(-1px);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .pill-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .pill {
        padding: 7px 10px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
        font-size: 0.85rem;
      }

      .chat-shell {
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: 14px;
        min-height: 780px;
      }

      .chat-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
      }

      .meta-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .meta-card {
        border: 1px solid var(--line);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.6);
        padding: 12px;
      }

      .meta-card strong {
        display: block;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--muted);
        margin-bottom: 6px;
      }

      .chat-log {
        overflow: auto;
        display: grid;
        gap: 12px;
        align-content: start;
        padding-right: 6px;
      }

      .message {
        max-width: 88%;
        border-radius: 18px;
        padding: 13px 15px;
        line-height: 1.5;
        white-space: pre-wrap;
        box-shadow: 0 12px 25px rgba(38, 31, 22, 0.08);
      }

      .message.user {
        justify-self: end;
        background: #1a675f;
        color: white;
      }

      .message.assistant {
        justify-self: start;
        background: #fffaf2;
        border: 1px solid rgba(38, 31, 22, 0.12);
      }

      .message small {
        display: block;
        margin-bottom: 6px;
        color: inherit;
        opacity: 0.7;
      }

      .chat-form textarea {
        min-height: 112px;
      }

      .detail-list {
        display: grid;
        gap: 10px;
        margin-top: 12px;
      }

      .detail-list div {
        padding: 10px 12px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.62);
        border: 1px solid var(--line);
      }

      .hint {
        font-size: 0.88rem;
        color: var(--warning);
      }

      @media (max-width: 1080px) {
        .layout {
          grid-template-columns: 1fr;
        }

        .chat-shell {
          min-height: auto;
        }
      }

      @media (max-width: 720px) {
        .field-row,
        .meta-grid {
          grid-template-columns: 1fr;
        }

        .shell {
          width: min(100% - 18px, 1320px);
          margin-top: 10px;
        }

        .hero,
        .panel {
          border-radius: 18px;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <section class="hero">
        <h1>Preview ed-support-ai-plug in the browser.</h1>
        <p>
          This demo host simulates a classroom tool. It creates a session and thread, lets you submit lesson context,
          artifact snapshots, and activity events, and then chats against the live local AI service using the same SDK
          a real host app would use.
        </p>
        <div class="hero-row">
          <div class="pill-list">
            <span class="pill">mock provider friendly</span>
            <span class="pill">MEME preset</span>
            <span class="pill">Net.Create preset</span>
            <span class="pill">teacher policy controls</span>
          </div>
          <div class="status" id="status" data-kind="info">Waiting for a preview session.</div>
        </div>
      </section>

      <section class="layout">
        <div class="stack">
          <section class="panel">
            <h2>Session Setup</h2>
            <p>Configure the classroom context, then start a preview session. Presets will populate the form.</p>
            <div class="button-row" style="margin-bottom: 14px;">
              <button type="button" class="secondary" id="preset-meme">Load MEME Preset</button>
              <button type="button" class="secondary" id="preset-netcreate">Load Net.Create Preset</button>
              <button type="button" class="secondary" id="reset-preview">Reset Preview State</button>
            </div>
            <form id="setup-form" class="field-grid">
              <label>
                Service base URL
                <input id="serviceBaseUrl" name="serviceBaseUrl" value="${injectedServiceBaseUrl}" />
              </label>
              <div class="field-row">
                <label>
                  Classroom ID
                  <input id="classroomId" name="classroomId" />
                </label>
                <label>
                  Tool name
                  <input id="toolName" name="toolName" />
                </label>
              </div>
              <div class="field-row">
                <label>
                  Student ID
                  <input id="studentId" name="studentId" />
                </label>
                <label>
                  Grade band
                  <input id="gradeBand" name="gradeBand" />
                </label>
              </div>
              <div class="field-row">
                <label>
                  Age band
                  <input id="ageBand" name="ageBand" />
                </label>
                <label>
                  Reading level
                  <input id="readingLevel" name="readingLevel" />
                </label>
              </div>
              <label>
                Support mode
                <select id="mode" name="mode">
                  <option value="hint_only">hint_only</option>
                  <option value="socratic">socratic</option>
                  <option value="evidence_first">evidence_first</option>
                  <option value="direct_explain">direct_explain</option>
                  <option value="challenge_student_thinking">challenge_student_thinking</option>
                </select>
              </label>
              <label>
                Teacher guidance
                <textarea id="systemGuidance" name="systemGuidance"></textarea>
              </label>
              <label>
                Behavior rules, one per line
                <textarea id="behaviorRules" name="behaviorRules"></textarea>
              </label>
              <div class="field-row">
                <label>
                  Lesson ID
                  <input id="lessonId" name="lessonId" />
                </label>
                <label>
                  Unit name
                  <input id="unitName" name="unitName" />
                </label>
              </div>
              <label>
                Lesson title
                <input id="lessonTitle" name="lessonTitle" />
              </label>
              <label>
                Learning objectives, one per line
                <textarea id="learningObjectives" name="learningObjectives"></textarea>
              </label>
              <label>
                Vocabulary, one per line
                <textarea id="vocabulary" name="vocabulary"></textarea>
              </label>
              <label>
                Misconceptions, one per line
                <textarea id="misconceptions" name="misconceptions"></textarea>
              </label>
              <label>
                Success criteria, one per line
                <textarea id="successCriteria" name="successCriteria"></textarea>
              </label>
              <label>
                Approved lesson material text
                <textarea id="approvedMaterial" name="approvedMaterial"></textarea>
              </label>
              <button type="submit">Start Preview Session</button>
            </form>
          </section>

          <section class="panel">
            <h2>Context Inputs</h2>
            <p>Use these helpers to simulate what a real tool would send while the student works.</p>
            <form id="snapshot-form" class="field-grid" style="margin-bottom: 16px;">
              <label>
                Artifact snapshot JSON
                <textarea class="code-area" id="snapshotJson" name="snapshotJson"></textarea>
              </label>
              <button type="submit" class="secondary">Record Snapshot</button>
            </form>
            <form id="event-form" class="field-grid">
              <label>
                Activity event JSON
                <textarea class="code-area" id="eventJson" name="eventJson"></textarea>
              </label>
              <button type="submit" class="secondary">Record Event</button>
            </form>
            <p class="hint">Tip: send a snapshot before chatting if you want the prompt to include current artifact state.</p>
          </section>
        </div>

        <section class="panel chat-shell">
          <div>
            <div class="chat-actions">
              <div>
                <h2 style="margin-bottom: 4px;">Chat Preview</h2>
                <p style="margin: 0;">Talk to the service as if you were a student inside a host app.</p>
              </div>
              <div class="button-row">
                <button type="button" class="secondary" id="refresh-thread">Refresh Thread</button>
              </div>
            </div>
            <div class="meta-grid" style="margin-top: 14px;">
              <div class="meta-card"><strong>Session</strong><span id="sessionMeta">Not started</span></div>
              <div class="meta-card"><strong>Thread</strong><span id="threadMeta">Not started</span></div>
              <div class="meta-card"><strong>Service</strong><span id="serviceMeta">${injectedServiceBaseUrl}</span></div>
            </div>
          </div>

          <div class="chat-log" id="chatLog"></div>

          <div>
            <form id="chat-form" class="chat-form field-grid">
              <label>
                Selection context
                <input id="selectionContext" name="selectionContext" placeholder="Optional: selected node, evidence, map region, comment thread, etc." />
              </label>
              <label>
                Student message
                <textarea id="message" name="message" placeholder="Ask for help the way a student would."></textarea>
              </label>
              <div class="button-row">
                <button type="submit">Send Message</button>
              </div>
            </form>

            <div class="detail-list" id="assistantMeta"></div>
          </div>
        </section>
      </section>
    </div>

    <script>
      const STORAGE_KEY = 'ed-support-ai-plug-demo-state';

      const presets = {
        meme: {
          classroomId: 'bio-period-3',
          toolName: 'meme-demo',
          studentId: 'student-01',
          gradeBand: '7th grade',
          ageBand: '12-13',
          readingLevel: 'middle school',
          mode: 'evidence_first',
          systemGuidance: 'Keep the student focused on explaining how evidence supports or challenges model elements.',
          behaviorRules: 'Do not give the final answer.\\nAsk the student to connect claims to evidence in the model.\\nUse accessible middle-school language.',
          lessonId: 'ecosystems-unit-2-lesson-1',
          unitName: 'Ecosystems and Systems Thinking',
          lessonTitle: 'How does fertilizer runoff affect algae and fish populations?',
          learningObjectives: 'Explain how evidence supports or challenges parts of a model.\\nDescribe relationships between entities, processes, and outcomes.\\nRevise a model when new evidence appears.',
          vocabulary: 'entity\\nprocess\\noutcome\\nevidence\\nconfidence',
          misconceptions: 'Students may think one piece of evidence proves the whole model.\\nStudents may confuse correlation with mechanism.',
          successCriteria: 'Names a model element clearly.\\nLinks evidence to a claim.\\nExplains why the evidence matters.',
          approvedMaterial: 'Lesson note: Fertilizer runoff increases nutrients in water. Extra nutrients can increase algae growth. Increased algae can reduce oxygen levels, which can affect fish populations.',
          snapshotJson: JSON.stringify({
            artifactId: 'map-ecosystem-1',
            artifactType: 'concept-map',
            summary: 'Current model connects fertilizer runoff to algae growth and fish death, but the evidence link to oxygen is missing.',
            snapshot: {
              selectedNode: 'algae growth',
              linkedEvidence: ['simulation-oxygen-drop'],
              openCommentCount: 2
            }
          }, null, 2),
          eventJson: JSON.stringify({
            eventType: 'evidence_attached',
            artifactId: 'map-ecosystem-1',
            payload: {
              claim: 'algae growth reduces oxygen',
              evidenceId: 'simulation-oxygen-drop'
            }
          }, null, 2)
        },
        netcreate: {
          classroomId: 'dh-period-1',
          toolName: 'netcreate-demo',
          studentId: 'student-09',
          gradeBand: '11th grade',
          ageBand: '16-17',
          readingLevel: 'high school',
          mode: 'socratic',
          systemGuidance: 'Ask students to justify coding choices and cite textual evidence before making interpretive claims.',
          behaviorRules: 'Do not invent citations.\\nPrompt the student to explain why a node or edge belongs in the network.\\nEncourage checking for duplicates.',
          lessonId: 'abolition-network-lesson-2',
          unitName: 'Historical Networks',
          lessonTitle: 'Coding people, organizations, and influence in abolitionist correspondence',
          learningObjectives: 'Distinguish nodes from edges.\\nUse evidence to justify coding decisions.\\nCheck for ambiguity and duplicates in collaborative datasets.',
          vocabulary: 'node\\nedge\\nsource\\nduplicate\\ninterpretation',
          misconceptions: 'Students may code influence as a person instead of a relationship.\\nStudents may treat a mention as proof of a connection.',
          successCriteria: 'Uses a source-based rationale.\\nChooses the correct coding type.\\nChecks for duplicate entities.',
          approvedMaterial: 'Lesson note: A person or organization is usually a node. Influence, correspondence, or membership is usually an edge. A direct citation should support the coding choice.',
          snapshotJson: JSON.stringify({
            artifactId: 'network-table-4',
            artifactType: 'network-entry',
            summary: 'Student is deciding whether "mutual influence" between two abolitionist societies should be a node or an edge.',
            snapshot: {
              selectedEntities: ['Boston Female Anti-Slavery Society', 'Philadelphia Female Anti-Slavery Society'],
              draftEntryType: 'node',
              citationPresent: false
            }
          }, null, 2),
          eventJson: JSON.stringify({
            eventType: 'selection_changed',
            artifactId: 'network-table-4',
            payload: {
              selectedRows: [14, 15],
              draftEntryType: 'node'
            }
          }, null, 2)
        }
      };

      const state = {
        serviceBaseUrl: '${injectedServiceBaseUrl}',
        sessionId: '',
        threadId: ''
      };

      function byId(id) {
        return document.getElementById(id);
      }

      function parseLines(value) {
        return value
          .split('\\n')
          .map((item) => item.trim())
          .filter(Boolean);
      }

      function escapeHtml(value) {
        return value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      }

      function setStatus(message, kind) {
        const status = byId('status');
        status.textContent = message;
        status.dataset.kind = kind || 'info';
      }

      function persistState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }

      function syncMeta() {
        byId('sessionMeta').textContent = state.sessionId || 'Not started';
        byId('threadMeta').textContent = state.threadId || 'Not started';
        byId('serviceMeta').textContent = state.serviceBaseUrl || '${injectedServiceBaseUrl}';
      }

      function renderThread(thread) {
        const chatLog = byId('chatLog');
        if (!thread || !thread.messages || thread.messages.length === 0) {
          chatLog.innerHTML = '<div class="detail-list"><div>No messages yet.</div></div>';
          return;
        }

        chatLog.innerHTML = thread.messages
          .map((message) => {
            const role = message.role === 'assistant' ? 'assistant' : 'user';
            return '<div class="message ' + role + '"><small>' + escapeHtml(message.role) + '</small>' + escapeHtml(message.content) + '</div>';
          })
          .join('');
        chatLog.scrollTop = chatLog.scrollHeight;
      }

      function renderAssistantMeta(assistant) {
        const container = byId('assistantMeta');
        if (!assistant) {
          container.innerHTML = '';
          return;
        }

        const sourceIds = assistant.usedSourceIds && assistant.usedSourceIds.length > 0 ? assistant.usedSourceIds.join(', ') : 'None';
        const flags = assistant.policyFlags && assistant.policyFlags.length > 0 ? assistant.policyFlags.join(', ') : 'None';

        container.innerHTML = [
          '<div><strong>Teacher rationale</strong><br />' + escapeHtml(assistant.teacherRationale || 'None') + '</div>',
          '<div><strong>Used source IDs</strong><br />' + escapeHtml(sourceIds) + '</div>',
          '<div><strong>Policy flags</strong><br />' + escapeHtml(flags) + '</div>',
          '<div><strong>Suggested follow-up</strong><br />' + escapeHtml(assistant.suggestedFollowup || 'None') + '</div>'
        ].join('');
      }

      function fillFormWithPreset(preset) {
        byId('classroomId').value = preset.classroomId;
        byId('toolName').value = preset.toolName;
        byId('studentId').value = preset.studentId;
        byId('gradeBand').value = preset.gradeBand;
        byId('ageBand').value = preset.ageBand;
        byId('readingLevel').value = preset.readingLevel;
        byId('mode').value = preset.mode;
        byId('systemGuidance').value = preset.systemGuidance;
        byId('behaviorRules').value = preset.behaviorRules;
        byId('lessonId').value = preset.lessonId;
        byId('unitName').value = preset.unitName;
        byId('lessonTitle').value = preset.lessonTitle;
        byId('learningObjectives').value = preset.learningObjectives;
        byId('vocabulary').value = preset.vocabulary;
        byId('misconceptions').value = preset.misconceptions;
        byId('successCriteria').value = preset.successCriteria;
        byId('approvedMaterial').value = preset.approvedMaterial;
        byId('snapshotJson').value = preset.snapshotJson;
        byId('eventJson').value = preset.eventJson;
      }

      function collectBootstrapPayload() {
        return {
          serviceBaseUrl: byId('serviceBaseUrl').value.trim(),
          classroomId: byId('classroomId').value.trim(),
          toolName: byId('toolName').value.trim(),
          student: {
            studentId: byId('studentId').value.trim(),
            gradeBand: byId('gradeBand').value.trim() || undefined,
            ageBand: byId('ageBand').value.trim() || undefined,
            readingLevel: byId('readingLevel').value.trim() || undefined,
            profileNotes: []
          },
          teacherPolicy: {
            mode: byId('mode').value,
            systemGuidance: byId('systemGuidance').value.trim(),
            behaviorRules: parseLines(byId('behaviorRules').value)
          },
          lessonContext: {
            lessonId: byId('lessonId').value.trim(),
            title: byId('lessonTitle').value.trim(),
            unitName: byId('unitName').value.trim() || undefined,
            learningObjectives: parseLines(byId('learningObjectives').value),
            vocabulary: parseLines(byId('vocabulary').value),
            misconceptions: parseLines(byId('misconceptions').value),
            successCriteria: parseLines(byId('successCriteria').value),
            approvedMaterials: byId('approvedMaterial').value.trim()
              ? [
                  {
                    id: 'doc-1',
                    title: 'Teacher-provided lesson material',
                    content: byId('approvedMaterial').value.trim()
                  }
                ]
              : []
          }
        };
      }

      async function request(path, options) {
        const response = await fetch(path, {
          method: options.method || 'GET',
          headers: {
            'content-type': 'application/json'
          },
          body: options.body ? JSON.stringify(options.body) : undefined
        });

        const json = await response.json();
        if (!response.ok) {
          const errorMessage = json && json.error ? json.error : 'Request failed.';
          throw new Error(errorMessage);
        }

        return json;
      }

      async function refreshThread() {
        if (!state.threadId) {
          setStatus('Start a preview session first.', 'error');
          return;
        }

        const query = new URLSearchParams({
          serviceBaseUrl: state.serviceBaseUrl
        });
        const thread = await request('/api/threads/' + encodeURIComponent(state.threadId) + '?' + query.toString(), {
          method: 'GET'
        });
        renderThread(thread);
      }

      function resetState() {
        state.serviceBaseUrl = byId('serviceBaseUrl').value.trim() || '${injectedServiceBaseUrl}';
        state.sessionId = '';
        state.threadId = '';
        persistState();
        syncMeta();
        renderThread({ messages: [] });
        renderAssistantMeta(null);
        setStatus('Preview state reset. Start a new session when ready.', 'info');
      }

      function restoreState() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          fillFormWithPreset(presets.meme);
          syncMeta();
          renderThread({ messages: [] });
          return;
        }

        fillFormWithPreset(presets.meme);

        try {
          const parsed = JSON.parse(raw);
          state.serviceBaseUrl = parsed.serviceBaseUrl || state.serviceBaseUrl;
          state.sessionId = parsed.sessionId || '';
          state.threadId = parsed.threadId || '';
          byId('serviceBaseUrl').value = state.serviceBaseUrl;
        } catch (error) {
          state.serviceBaseUrl = '${injectedServiceBaseUrl}';
        }

        syncMeta();
        renderThread({ messages: [] });
      }

      byId('preset-meme').addEventListener('click', () => {
        fillFormWithPreset(presets.meme);
        setStatus('Loaded MEME preset.', 'success');
      });

      byId('preset-netcreate').addEventListener('click', () => {
        fillFormWithPreset(presets.netcreate);
        setStatus('Loaded Net.Create preset.', 'success');
      });

      byId('reset-preview').addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY);
        fillFormWithPreset(presets.meme);
        resetState();
      });

      byId('setup-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        setStatus('Creating preview session...', 'info');

        try {
          const payload = collectBootstrapPayload();
          const result = await request('/api/bootstrap', {
            method: 'POST',
            body: payload
          });

          state.serviceBaseUrl = result.serviceBaseUrl;
          state.sessionId = result.session.sessionId;
          state.threadId = result.thread.id;
          persistState();
          syncMeta();
          renderThread(result.thread);
          renderAssistantMeta(null);
          setStatus('Preview session created.', 'success');
        } catch (error) {
          setStatus(error.message, 'error');
        }
      });

      byId('snapshot-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!state.sessionId) {
          setStatus('Start a preview session before recording a snapshot.', 'error');
          return;
        }

        try {
          const snapshot = JSON.parse(byId('snapshotJson').value);
          await request('/api/snapshots', {
            method: 'POST',
            body: {
              serviceBaseUrl: state.serviceBaseUrl,
              sessionId: state.sessionId,
              snapshot
            }
          });
          setStatus('Snapshot recorded.', 'success');
        } catch (error) {
          setStatus(error.message, 'error');
        }
      });

      byId('event-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!state.sessionId) {
          setStatus('Start a preview session before recording an event.', 'error');
          return;
        }

        try {
          const payloadEvent = JSON.parse(byId('eventJson').value);
          await request('/api/events', {
            method: 'POST',
            body: {
              serviceBaseUrl: state.serviceBaseUrl,
              sessionId: state.sessionId,
              threadId: state.threadId || undefined,
              event: payloadEvent
            }
          });
          setStatus('Event recorded.', 'success');
        } catch (error) {
          setStatus(error.message, 'error');
        }
      });

      byId('chat-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!state.threadId) {
          setStatus('Start a preview session before chatting.', 'error');
          return;
        }

        const message = byId('message').value.trim();
        if (!message) {
          setStatus('Enter a student message first.', 'error');
          return;
        }

        setStatus('Sending message to the service...', 'info');

        try {
          const result = await request('/api/messages', {
            method: 'POST',
            body: {
              serviceBaseUrl: state.serviceBaseUrl,
              threadId: state.threadId,
              content: message,
              selectionContext: byId('selectionContext').value.trim() || undefined
            }
          });
          renderThread(result.thread);
          renderAssistantMeta(result.assistant);
          byId('message').value = '';
          setStatus('Assistant response received.', 'success');
        } catch (error) {
          setStatus(error.message, 'error');
        }
      });

      byId('refresh-thread').addEventListener('click', async () => {
        try {
          await refreshThread();
          setStatus('Thread refreshed.', 'success');
        } catch (error) {
          setStatus(error.message, 'error');
        }
      });

      restoreState();
      syncMeta();
    </script>
  </body>
</html>`;
}
