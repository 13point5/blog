"""Original explanatory SVGs. Run from the repository root; no dependencies."""
from pathlib import Path
from html import escape

OUT = Path('public/images/notes')
OUT.mkdir(parents=True, exist_ok=True)
INK, MUTED, BLUE = '#273044', '#697489', '#425ca8'
TEAL, PEACH, LILAC, YELLOW = '#c1ded4', '#f2d4b9', '#d5c9e9', '#ecdfa4'

def text(x,y,value,size=22,color=INK,anchor='start',weight=400):
    return f'<text x="{x}" y="{y}" fill="{color}" font-family="Arial, sans-serif" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}">{escape(value)}</text>'
def box(x,y,w,h,fill,rx=12):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"/>'
def line(x1,y1,x2,y2,color=BLUE,dash=False):
    return f'<path d="M{x1} {y1} L{x2} {y2}" stroke="{color}" stroke-width="3" fill="none" marker-end="url(#arrow)"'+(' stroke-dasharray="7 6"' if dash else '')+'/>'
def path(d,dash=False):
    return f'<path d="{d}" stroke="{BLUE}" stroke-width="3" fill="none" marker-end="url(#arrow)"'+(' stroke-dasharray="7 6"' if dash else '')+'/>'
def node(x,y,w,h,label,fill,sub=None):
    s=box(x,y,w,h,fill)+text(x+w/2,y+h/2+(0 if sub else 8),label,23,anchor='middle',weight=500)
    if sub:s+=text(x+w/2,y+h/2+29,sub,16,MUTED,'middle')
    return s

def save(name,title,subtitle,body,desc):
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="960" height="520" viewBox="0 0 960 520" role="img" aria-labelledby="title desc">
<title id="title">{escape(title)}</title><desc id="desc">{escape(desc)}</desc>
<defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L8 4L0 8" fill="{BLUE}"/></marker></defs>
<rect width="960" height="520" rx="12" fill="#eef1f5"/>
{text(40,48,title,27,weight=500)}{text(40,79,subtitle,16,MUTED)}{body}
</svg>'''
    (OUT/f'{name}.svg').write_text(svg)

body=node(70,168,210,108,'Policy',LILAC,'choose an action')+node(390,168,235,108,'Environment',TEAL,'run the interaction')+node(705,168,185,108,'Reward',YELLOW,'score the outcome')
body+=line(282,222,383,222)+text(334,198,'action',16,MUTED,'middle')+line(630,222,698,222)
body+=path('M795 285 V394 H176 V285')+text(490,381,'Learning updates the policy from collected experience',20,BLUE,'middle')
body+=path('M505 162 V119 H176 V162',True)+text(340,111,'next observation',16,MUTED,'middle')
body+=text(40,478,'For an LLM: context → generated tokens or tool calls → feedback',18,MUTED)
save('rl-loop','Feedback changes the next attempt','A conceptual reinforcement learning loop',body,'A policy acts in an environment. The environment returns a new observation. A reward scores the outcome, and learning uses experience to update the policy.')

body=text(53,143,'SAME MODEL',15,MUTED,weight=600)+text(265,143,'Task success',20)+text(450,143,'Cost',20)+text(595,143,'Robustness',20)+text(787,143,'Trace',20)
rows=[('Code edit',[1,2,1,0]),('Tool use',[2,1,0,1]),('Long task',[0,1,2,2])]
colors=[TEAL,YELLOW,LILAC]
for i,(label,values) in enumerate(rows):
 y=170+i*77
 body+=text(53,y+38,label,22)
 for j,v in enumerate(values):
  x=255+j*165
  body+=box(x,y,145,59,colors[v],8)
  if j==3:
   for k in range(3):body+=f'<rect x="{x+20}" y="{y+15+k*11}" width="{55+k*20}" height="3" rx="1" fill="#7a8596"/>'
  else:body+=text(x+72,y+37,['inspect','compare','repeat'][v],17,anchor='middle')
body+=text(53,463,'One aggregate score cannot describe every task and failure mode.',20,BLUE)
save('eval-matrix','Evaluation is a matrix, not a podium','Illustrative review dimensions — no model scores are plotted',body,'Three task types are considered across success, cost, robustness, and execution traces. Colored cells are placeholders for review activities, not measured performance.')

body=text(60,138,'CAUSAL VISIBILITY',16,MUTED,weight=600)
for i in range(5):
 for j in range(5):
  body+=box(75+j*47,162+i*47,38,38,BLUE if j<=i else '#dde2eb',4)
body+=text(181,434,'Earlier tokens are visible.',17,MUTED,'middle')+text(181,459,'Future tokens are masked.',17,MUTED,'middle')
body+=node(406,148,228,82,'Self-attention',LILAC,'mix across positions')+node(406,308,228,82,'Feed-forward',PEACH,'transform each position')
body+=line(520,235,520,299)+line(642,350,711,350)+node(724,308,174,82,'Next layer',TEAL)
body+=path('M406 185 H358 V414 H680 V350')+text(404,447,'Residual paths preserve and update the stream.',17,MUTED)
body+=text(408,478,'Schematic; normalization and projections omitted.',15,MUTED)
save('attention','Mix information. Transform it. Repeat.','Two different jobs inside a decoder-style Transformer block',body,'A lower-triangular mask permits causal attention to current and earlier positions. Self-attention mixes information between tokens; a feed-forward network transforms each position. Residual paths carry information around sublayers. Normalization and projections are omitted.')

body=node(50,148,205,100,'Experience',TEAL,'from the environment')+node(376,148,205,100,'World model',LILAC,'learned dynamics')+node(702,148,205,100,'Imagined rollout',PEACH,'predicted states')
body+=line(261,198,368,198)+text(314,178,'fit',16,MUTED,'middle')+line(588,198,693,198)+text(641,178,'simulate',16,MUTED,'middle')
body+=node(376,354,205,94,'Policy + value',YELLOW,'learn from rollouts')+path('M804 255 V400 H590')+path('M368 400 H152 V256')
body+=text(182,381,'act',17,MUTED)+text(684,381,'improve',17,MUTED)
save('world-model','Learn a world. Practice inside it.','A conceptual loop inspired by latent world-model agents',body,'Real environment experience trains a world model. The model produces imagined rollouts for learning a policy and value function. The policy then gathers further real experience.')

body=node(60,155,226,102,'Formal statement',TEAL,'what must be true')+node(368,155,224,102,'Proposed proof',LILAC,'from a model or tactic')+node(676,155,224,102,'Kernel checks',YELLOW,'against the statement')
body+=line(293,208,360,208)+line(598,208,668,208)+path('M788 265 V330 H483 V265',True)+text(630,319,'feedback / retry',17,MUTED,'middle')
body+=box(60,383,840,73,'#e0e5ee',9)+text(480,414,'A checked proof establishes the formal claim under its assumptions.',20,BLUE,'middle')+text(480,442,'It does not check whether that claim matches your intention.',18,MUTED,'middle')
save('verification','Generation proposes. Verification checks.','Separating proof search from proof checking',body,'A formal statement and a proposed proof are submitted to the kernel. Rejected attempts can be revised. A checked proof establishes the encoded proposition under its axioms, not the correctness of the original informal specification.')
