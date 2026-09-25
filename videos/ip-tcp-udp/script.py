"""Narration for the IP / TCP / UDP explainer.

Each scene is (scene_id, [lines]). A line is either a string (shown as the
caption and spoken as-is, after SPOKEN substitutions) or a (caption, spoken)
tuple when the voice needs a different spelling than the caption.

The animation in index.html refers to lines by their index inside a scene
(S.c(i) = start time of line i), so keep scene ids and line order in sync
with the draw functions there.
"""

import re

SCENES = [
    ("intro", [
        "Every time you load a web page, join a video call, or play an online game, your computer chops data into small packets and flings them across the planet.",
        "Three protocols do most of that work: IP, TCP, and UDP.",
        "We'll look at how each one actually works under the hood, what it really means for a TCP connection to be established and stay alive, and which one you'd pick for real problems, and why.",
    ]),
    ("layers", [
        "First, the big picture. Networking is built in layers, like envelopes inside envelopes.",
        "Your app's data, say a request for a web page, goes into a TCP or UDP envelope. That envelope says which program on the machine it's for, using a port number.",
        "That goes inside an IP envelope, which says which machine on the internet it's for, using an IP address.",
        "And that goes inside a Wi-Fi or Ethernet frame, which only gets it to the next box on the path, like your home router.",
        "Each layer only reads its own envelope. Routers in the middle of the internet look at the IP envelope, and forward it. They don't care what's inside.",
    ]),
    ("ip", [
        ("Let's start with IP. Every device on the internet has an IP address. An IPv4 address is just a 32-bit number, written as four bytes, like 142.250.72.14.",
         "Let's start with IP. Every device on the internet has an IP address. An I P version 4 address is just a 32-bit number, written as four bytes, like 142 dot 250 dot 72 dot 14."),
        "An IP packet is a header followed by data. The header holds the source address, the destination address, a time to live counter, and a field saying what's inside: TCP or UDP.",
        "There is no single wire from you to the server. Your packet is passed from router to router. Each router looks at the destination address, checks its routing table, and forwards the packet one hop closer.",
        "Every hop decreases the time to live by one. If it ever hits zero, the packet is thrown away, so a lost packet can't loop around the internet forever.",
    ]),
    ("besteffort", [
        "Here's the crucial part. IP is best effort. It tries, but it promises nothing.",
        "If a router's queue is full, it simply drops your packet. No error. No notice to anyone.",
        "Packets can take different paths, so they can arrive out of order. Occasionally, one even arrives twice.",
        "And IP only gets data to a machine. It has no idea which program on that machine should receive it.",
        "Those two gaps, reliability, and getting data to the right program, are exactly what TCP and UDP deal with. Very differently.",
    ]),
    ("ports", [
        "Both TCP and UDP start with ports. If the IP address is the building, the port is the apartment number.",
        "A port is a 16-bit number. A web server listens on port 443. A DNS server on port 53. Your browser gets a random temporary port, like 52,100, for each connection it opens.",
        "When a packet arrives, the operating system reads the destination port, and hands the data to whichever program opened that port.",
    ]),
    ("udp", [
        "UDP is the simple one. Its whole header is eight bytes: source port, destination port, length, and a checksum. That's it.",
        "The checksum lets the receiver detect corrupted data and throw it away. Nothing else is added.",
        "There's no handshake, no connection, no sequence numbers, no acknowledgements. Your program hands the operating system a message, called a datagram, and it goes out immediately as one packet.",
        "If it's lost, nobody finds out. If two arrive out of order, the program gets them out of order. UDP is basically IP, plus ports, plus a checksum.",
        "That sounds bad, but it means UDP adds almost no delay. The very first packet carries real data, and nothing ever waits for anything else.",
    ]),
    ("tcp", [
        "TCP makes the opposite promise. It gives your program a reliable, ordered stream of bytes. Whatever you write on one end comes out the other end, complete, in order, with no duplicates. Or you get an error.",
        "To pull that off on top of unreliable IP, its header carries a lot more: a sequence number, an acknowledgement number, flags like SYN, ACK and FIN, and a window size.",
        "The sequence number counts bytes. It says: the first byte in this packet is byte number such and such of the stream.",
    ]),
    ("handshake", [
        "Before any data flows, TCP does a three-way handshake.",
        "The client picks a random starting sequence number, say 1000, and sends a SYN packet. I want to talk. My bytes start at 1000.",
        "The server picks its own random number, say 5000, and replies with a SYN-ACK. OK. My bytes start at 5000. And I got your 1000, so I expect 1001 next.",
        "The client replies with an ACK. Got your 5000. Expecting 5001.",
        "That's it. Both sides now know each other's starting numbers, and both have agreed to talk.",
        "Notice the cost. One full round trip before the first byte of real data. If the server is 100 milliseconds away, that's 100 milliseconds of just saying hello.",
    ]),
    ("reliable", [
        "Now data flows. The client sends bytes 1001 to 2000, then 2001 to 3000, then 3001 to 4000.",
        "The receiver answers with acknowledgements. ACK 2001 means: I have everything up to byte 2000. Send me 2001 next.",
        "Now suppose the second packet is lost. The receiver gets bytes 3001 to 4000, but it can't hand them to the program yet, because there's a hole. It holds them in a buffer, and keeps saying: ACK 2001. I'm still missing 2001.",
        "The sender sees the repeated ACKs, or a timer runs out, and it resends the missing packet. The hole is filled, and all the bytes are released to the program, in order.",
        "But notice: the bytes after the gap had already arrived. They sat there, blocked, waiting for the lost packet. That's called head-of-line blocking, and it matters a lot later.",
    ]),
    ("flow", [
        "TCP also controls its speed. The receiver advertises a window: how much free buffer space it has, so a fast sender can't overwhelm a slow receiver.",
        "And the sender keeps a congestion window. It starts small, grows as ACKs come back, and cuts back sharply when packets are lost, because loss usually means some router's queue is full.",
        "That's why a big download ramps up over the first second or so, instead of starting at full speed.",
    ]),
    ("connection", [
        "So, what does it actually mean that a TCP connection is established, and stays alive?",
        "Here's the surprising answer. There is no wire. No reserved path. No circuit. The routers in between have no idea your connection exists. They just forward individual packets.",
        ("A TCP connection is nothing more than a small record in memory, on each of the two computers. In the Linux kernel, it's a struct called tcp_sock.",
         "A TCP connection is nothing more than a small record in memory, on each of the two computers. In the Linux kernel, it's a struct called T C P sock."),
        "It's identified by four values: local IP, local port, remote IP, and remote port. And it stores the state. ESTABLISHED. The next sequence number to send. The oldest byte not yet acknowledged. The next byte expected from the other side. The window sizes. A send buffer, a receive buffer, and a retransmission timer.",
        "When a packet arrives, the kernel reads those four values from the headers, looks them up in a hash table, finds the matching record, checks the sequence number, and copies the data into that connection's receive buffer. Your program gets it when it reads from the socket.",
        "Established just means both sides have created that record, and finished the handshake. That's the whole connection.",
    ]),
    ("alive", [
        "Now, stays alive. If neither side sends anything for an hour, how many packets cross the network? Zero. Both records just sit in memory.",
        "That's why you can unplug your network cable for ten seconds, plug it back in, and an idle SSH session carries on as if nothing happened, as long as your IP address didn't change.",
        "But there's a catch. Nobody notices if the other side disappears. If the server crashes and reboots, its record is gone. Your side still says ESTABLISHED. This is called a half-open connection.",
        "The next time you send data, the server's kernel looks up the four values, finds nothing, and replies with a reset packet, RST. Your program gets the famous error: connection reset by peer.",
        "To find dead peers sooner, TCP has an optional keepalive: after a period of silence, send a tiny probe that the other side must acknowledge. On Linux the default wait is two hours, so most apps send their own heartbeats instead.",
    ]),
    ("nat", [
        "There's one more reason heartbeats exist. Your home router does network address translation. It keeps its own table, mapping your private address and port to a public one.",
        "If an entry sees no traffic for a while, sometimes just a few minutes, the router forgets it. Packets from the server no longer get through, even though both computers still think they're connected.",
        "So chat apps and WebSockets send a tiny ping every thirty seconds or so. That's what keeping a connection alive means in practice: making sure every table along the way keeps remembering you.",
        "And when you're done, each side sends a FIN, the other acknowledges it, and the records are deleted. Closing a connection doesn't cut a wire. It frees memory.",
        "UDP, by contrast, keeps no per-connection state at all. A UDP socket is just an open port. Every datagram stands alone. If an app wants a session, it has to build one itself.",
    ]),
    ("usecases", [
        "Now let's make this concrete. We'll take real problems, and see what happens when you solve the same problem with each protocol.",
    ]),
    ("call", [
        "Problem one: a video call. Audio is chopped into packets, each holding about 20 milliseconds of sound. They need to be played within about 150 milliseconds, or the conversation starts to feel laggy.",
        "Over TCP, one packet gets lost. The receiver already has the packets after it, but TCP won't release them until the lost one is resent. That takes at least a round trip. So the audio freezes, and then the stale audio comes out in a burst.",
        "Over UDP, the packet is lost, the app notices a gap in its own numbering, and it smooths over 20 milliseconds of missing sound. You might hear a tiny glitch. The conversation keeps going in real time.",
        "That's why Zoom, FaceTime, Discord and WebRTC send their media over UDP. The trade-off: the app itself has to deal with loss, jitter, and congestion.",
    ]),
    ("game", [
        "Problem two: a multiplayer game, sending every player's position 60 times a second.",
        "Over TCP, a lost update blocks the newer ones behind it. When it finally arrives, it's already out of date. Players see stutter, and rubber-banding.",
        "Over UDP, a lost update barely matters. The next one, 16 milliseconds later, has a newer position anyway. Only the latest state counts.",
        "But some game data must never be lost, like: you bought this item, or a chat message. So games usually build a small reliable channel on top of UDP for those, and send positions unreliably.",
    ]),
    ("download", [
        "Problem three: downloading a file, loading a web page, or sending a bank transfer. Here, every single byte matters. One missing byte corrupts the file, or breaks the page's code.",
        "Over TCP, you get all of it, in order, with zero extra work in your app. Waiting a little longer for a retransmission is completely fine.",
        "Over raw UDP, you'd have to reinvent sequence numbers, acknowledgements, retransmission, and congestion control yourself. Get congestion control wrong, and you can flood the network for everyone. So for decades, the answer here was simply TCP.",
    ]),
    ("dns", [
        "Problem four: DNS, turning a name like example.com into an IP address. The question and the answer each fit in one small packet.",
        "Over TCP, you'd pay a full handshake round trip before you could even ask. That doubles the time of a lookup that happens before almost everything you do online.",
        "Over UDP, it's one packet out, and one packet back. If no answer arrives in time, the client just asks again. Retrying is cheap, because the request is tiny and repeating it is harmless.",
        "And when an answer is too big for one packet, DNS switches to TCP. Right tool for each case.",
    ]),
    ("stream", [
        "Problem five is a trick question: streaming a movie on Netflix. It's video, so it must be UDP, right? Actually, Netflix streams over plain TCP.",
        "The difference is the buffer. The player downloads many seconds ahead of what you're watching. If a packet is lost, there's plenty of time to resend it before it's needed. You get perfect quality, and no glitches.",
        "A video call can't buffer seconds ahead, because that part of the conversation hasn't happened yet. So the real question isn't: is it video? It's: does late data still have value?",
    ]),
    ("decide", [
        "So here's the mental model.",
        "Choose TCP when every byte must arrive, in order, and a little extra delay is fine. Web pages, APIs, file transfers, email, SSH, databases.",
        "Choose UDP when fresh beats complete. When old data is worthless, or the exchange is tiny. Voice and video calls, games, live broadcasts, DNS, and time sync.",
    ]),
    ("quic", [
        ("One last twist ties it all together. HTTP/3, which carries a big share of web traffic today, runs over a protocol called QUIC. And QUIC runs on UDP.",
         "One last twist ties it all together. H T T P 3, which carries a big share of web traffic today, runs over a protocol called QUIC. And QUIC runs on UDP."),
        "QUIC rebuilds TCP's reliability inside the application: sequence numbers, acknowledgements, retransmission, congestion control. But it tracks many independent streams, so a lost packet for one image doesn't block the others.",
        "And remember that a TCP connection is looked up by four values, including your IP address? When your phone switches from Wi-Fi to cellular, your IP changes, the four values no longer match anything, and every TCP connection breaks.",
        "QUIC instead puts a connection ID in every packet. Your IP can change, and the server still finds the same connection record. Once again: a connection is just state. QUIC simply picked a better key for it.",
    ]),
    ("recap", [
        "Let's recap. IP moves packets between machines, hop by hop, with no guarantees.",
        "UDP adds ports and a checksum, and gets out of the way.",
        "TCP adds a handshake, sequence numbers, acknowledgements, retransmission, and flow control, to turn lost and shuffled packets into a clean, ordered stream.",
        "And a connection isn't a wire. It's a record in memory on two machines, kept in sync by sequence numbers. It's alive for exactly as long as both sides, and everything in between, remember it.",
    ]),
]


def spoken(text: str) -> str:
    """Spellings that read better through Kokoro's phonemizer."""
    text = text.replace("SYN-ACK", "sin-ack")
    text = re.sub(r"\bSYN\b", "sin", text)
    text = text.replace("example.com", "example dot com")
    text = text.replace("Wi-Fi", "WiFi")
    return text


def lines(scene):
    for line in scene[1]:
        if isinstance(line, tuple):
            yield line[0], spoken(line[1])
        else:
            yield line, spoken(line)
