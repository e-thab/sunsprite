import time

last_print_time = time.time()
dots = '...'

all_words = []
with open('6_letter_words.txt') as file:
    for line in file:
        if line == '':
            continue
        all_words.append(line.strip())
    
        current_time = time.time()
        if current_time > last_print_time + 0.4:
            last_print_time = current_time
            print(f'Compiling all words{dots}   \r', end='')
            match dots:
                case '':
                    dots = '.'
                case '.':
                    dots = '..'
                case '..':
                    dots = '...'
                case '...':
                    dots = ''

# usable_word_start = time.time()
usable_words = []
for word in all_words:
    reverse = word[::-1]
    if reverse in all_words and reverse not in usable_words and word not in usable_words:
        usable_words.append(word)
        if word != word[::-1]:
            usable_words.append(word[::-1])
    
    current_time = time.time()
    if current_time > last_print_time + 0.4:
        last_print_time = current_time
        print(f'Finding usable words{dots}   \r', end='')
        match dots:
            case '':
                dots = '.'
            case '.':
                dots = '..'
            case '..':
                dots = '...'
            case '...':
                dots = ''

with open('6_letter_usable.txt', 'w',) as file:
    file_text = ''
    for word in usable_words:
        file_text += word + '\n'
    file.write(file_text)
print(usable_words)

# input_words = input("Enter words: ")
# while input_words:
#     words = input_words.split(' ')

#     while len(words) < 3:
#         words.append('______')

#     print(f"""
#     {words[0][0]}{words[0][1]}{words[0][2]}{words[0][3]}{words[0][4]}{words[0][5]}
#     {words[0][1]}{words[1][1]}{words[1][2]}{words[1][3]}{words[1][4]}{words[0][4]}
#     {words[0][2]}{words[1][2]}{words[2][2]}{words[2][3]}{words[1][3]}{words[0][3]}
#     {words[0][3]}{words[1][3]}{words[2][3]}{words[2][2]}{words[1][2]}{words[0][2]}
#     {words[0][4]}{words[1][4]}{words[1][3]}{words[1][2]}{words[1][1]}{words[0][1]}
#     {words[0][5]}{words[0][4]}{words[0][3]}{words[0][2]}{words[0][1]}{words[0][0]}
#     """)
#     input_words = input("Enter words: ")

squares = []

for i in range(len(usable_words)):
    for j in range(i+1, len(usable_words)):
        for k in range(j+1, len(usable_words)):
            words = [usable_words[i], usable_words[j], usable_words[k]]
            # print(f'trying {words[0]} {words[1]} {words[2]}')

            if (
                    f'{words[0][1]}{words[1][1]}{words[1][2]}{words[1][3]}{words[1][4]}{words[0][4]}' in usable_words
                and f'{words[0][2]}{words[1][2]}{words[2][2]}{words[2][3]}{words[1][3]}{words[0][3]}' in usable_words
                and f'{words[0][3]}{words[1][3]}{words[2][3]}{words[2][2]}{words[1][2]}{words[0][2]}' in usable_words
                and f'{words[0][4]}{words[1][4]}{words[1][3]}{words[1][2]}{words[1][1]}{words[0][1]}' in usable_words

                and f'{words[0][1]}{words[1][1]}{words[1][2]}{words[1][3]}{words[1][4]}{words[0][4]}' in usable_words
                and f'{words[0][2]}{words[1][2]}{words[2][2]}{words[2][3]}{words[1][3]}{words[0][3]}' in usable_words
                and f'{words[0][3]}{words[1][3]}{words[2][3]}{words[2][2]}{words[1][2]}{words[0][2]}' in usable_words
                and f'{words[0][4]}{words[1][4]}{words[1][3]}{words[1][2]}{words[1][1]}{words[0][1]}' in usable_words

                # and f'' in all_words
                # and f'' in all_words

                # and f'' in all_words
                # and f'' in all_words
                # and f'' in all_words
                    ):
                squares.append([words[0], words[1], words[2]])
                print(f"""
                {words[0][0]}{words[0][1]}{words[0][2]}{words[0][3]}{words[0][4]}{words[0][5]}
                {words[0][1]}{words[1][1]}{words[1][2]}{words[1][3]}{words[1][4]}{words[0][4]}
                {words[0][2]}{words[1][2]}{words[2][2]}{words[2][3]}{words[1][3]}{words[0][3]}
                {words[0][3]}{words[1][3]}{words[2][3]}{words[2][2]}{words[1][2]}{words[0][2]}
                {words[0][4]}{words[1][4]}{words[1][3]}{words[1][2]}{words[1][1]}{words[0][1]}
                {words[0][5]}{words[0][4]}{words[0][3]}{words[0][2]}{words[0][1]}{words[0][0]}
                """)
            
            current_time = time.time()
            if current_time > last_print_time + 0.4:
                last_print_time = current_time
                print(f'Searching for squares{dots}   \r', end='')
                match dots:
                    case '':
                        dots = '.'
                    case '.':
                        dots = '..'
                    case '..':
                        dots = '...'
                    case '...':
                        dots = ''

print()
print(squares)

"""
DENNIS
E....I
N....N
N....N
I....E
SINNED

Sator square:
SATOR
AREPO
TENET
OPERA
ROTAS

Best:
DENNIS SINNED
DIAPER REPAID
DIALER RELAID
DRAWER REWARD
LOOTER RETOOL
PUPILS SLIPUP
REDIPS SPIDER
REDRAW WARDER
RETROS SORTER
SNOOPS SPOONS

Runners up:
ANIMAL LAMINA
ANODES SEDONA
ASSERT TRESSA
BARGER REGRAB
DEFLOW WOLFED
DENIER REINED
ELBERT TREBLE
GELDER REDLEG
KRAMER REMARK
REVERT TREVER
"""

# Full output
"""
AAAAAA AAAAAA
ABADAN NADABA
ABROOD DOORBA
AGENES SENEGA
ALITTA ATTILA
ALLINA ANILLA
ALLIUM MUILLA
ALODIE EIDOLA
AMEDEO OEDEMA
AMICED DECIMA
AMILES SELIMA
AMUNAM MANUMA
ANABAL LABANA
ANABAS SABANA
ANAKIM MIKANA
ANELES SELENA
ANIMAL LAMINA
ANIMES SEMINA
ANITRA ARTINA
ANODES SEDONA
ANURAN NARUNA
ARAMIS SIMARA
ASSERT TRESSA
ATELES SELETA
ATOKAL LAKOTA
BARGER REGRAB
BRUTED DETURB
COLVER REVLOC
DADDAH HADDAD
DARTER RETRAD
DECART TRACED
DECURT TRUCED
DEFLOW WOLFED
DEGAMI IMAGED
DEGGED DEGGED
DELIAN NAILED
DENIER REINED
DENIES SEINED
DENNED DENNED
DENNEY YENNED
DENNIS SINNED
DEPOTS STOPED
DERATS STARED
DESIRI IRISED
DESSUS SUSSED
DEWANS SNAWED
DIALER RELAID
DIAPER REPAID
DIBROM MORBID
DORMIN NIMROD
DORTER RETROD
DRAWER REWARD
ECITON NOTICE
ELBERT TREBLE
ELEELE ELEELE
ELIDES SEDILE
ELUTES SETULE
ENAMOR ROMANE
ENSERF FRESNE
ERGATE ETAGRE
EVARTS STRAVE
EVILER RELIVE
FOSTER RETSOF
FRODIN NIDORF
GANGAN NAGNAG
GAWGAW WAGWAG
GELDER REDLEG
GITTER RETTIG
GOLFER REFLOG
HALLAH HALLAH
HALLAN NALLAH
HANNAH HANNAH
HANNON NONNAH
HARDEN NEDRAH
HARRAH HARRAH
HARRIS SIRRAH
HARRUS SURRAH
HAWHAW WAHWAH
INITAL LATINI
KAKKAK KAKKAK
KASSAK KASSAK
KRAMER REMARK
LANGER REGNAL
LEMMAS SAMMEL
LERRET TERREL
LESSON NOSSEL
LEVINS SNIVEL
LEWERT TREWEL
LIEVER REVEIL
LOOMIS SIMOOL
LOOTER RETOOL
MALLAM MALLAM
MANITU UTINAM
MARRAM MARRAM
METSYS SYSTEM
MICROS SORCIM
MOODER REDOOM
MUNGER REGNUM
NEDDER REDDEN
NEDROW WORDEN
NIDDER REDDIN
NONAIR RIANON
PALMER REMLAP
PULLUP PULLUP
PUPILS SLIPUP
REBUTS STUBER
RECAPS SPACER
RECART TRACER
REDART TRADER
REDDER REDDER
REDIPS SPIDER
REDRAW WARDER
REFLET TELFER
REFLOW WOLFER
REGGIS SIGGER
REITER RETIER
REIVES SEVIER
REKLAW WALKER
REKNIT TINKER
REMEET TEEMER
REMMER REMMER
RENNER RENNER
RENNET TENNER
REPINS SNIPER
REPORT TROPER
REPOTS STOPER
RETIES SEITER
RETROS SORTER
RETTER RETTER
REVERT TREVER
SARDIS SIDRAS
SCARES SERACS
SECRET TERCES
SELAHS SHALES
SELLES SELLES
SEMMES SEMMES
SENNET TENNES
SERVES SEVRES
SIDNAW WANDIS
SINNET TENNIS
SKEETS STEEKS
SLEEPS SPEELS
SLEETS STEELS
SLOOPS SPOOLS
SNOOPS SPOONS
SPIRTS STRIPS
SPORTS STROPS
SPRITS STIRPS
SSTTSS SSTTSS
STRAWS SWARTS
STRUTS STURTS
SUCCUS SUCCUS
TEBBET TEBBET
TERRET TERRET
TERRIT TIRRET
TIBBIT TIBBIT
TIRRIT TIRRIT
"""