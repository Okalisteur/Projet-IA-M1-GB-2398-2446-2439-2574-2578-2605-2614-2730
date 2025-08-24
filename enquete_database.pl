% -------- SECTION 1: Types de crime et statuts --------
crime_type(vol).
crime_type(assassinat).
crime_type(escroquerie).

% Statuts possibles d'une personne
status_type(innocent).
status_type(suspect).
status_type(coupable).
status_type(complice).

% -------- SECTION 2: Personnes dans l'enquête --------
% Tous les acteurs de l'enquête (suspects initiaux + personnes "normales")
person(john).
person(mary).
person(alice).
person(bruno).
person(sophie).
person(pierre).      
person(claire).      
person(lucas).       

% Suspects initiaux (ceux qu'on soupçonne dès le début)
initial_suspect(john).
initial_suspect(mary).
initial_suspect(alice).
initial_suspect(bruno).
initial_suspect(sophie).

% Personnes "normales" qui peuvent devenir suspectes plus tard
normal_person(pierre).
normal_person(claire).
normal_person(lucas).

% -------- SECTION 3: Indices et Faits de base --------

% MOBILES
has_motive(john, vol).
has_motive(mary, assassinat).
has_motive(alice, escroquerie).
has_motive(pierre, assassinat).    

% PROXIMITÉ DE LA SCÈNE
was_near_crime_scene(john, vol).
was_near_crime_scene(mary, assassinat).
was_near_crime_scene(pierre, assassinat).  % Complice potentiel

% EMPREINTES
has_fingerprint_on_weapon(john, vol).
has_fingerprint_on_weapon(mary, assassinat).

% PREUVES FINANCIÈRES
has_bank_transaction(alice, escroquerie).
has_bank_transaction(bruno, escroquerie).
owns_fake_identity(sophie, escroquerie).

% TÉMOIGNAGES
eyewitness_identification(mary, assassinat).
eyewitness_identification(pierre, assassinat).  % Vu comme complice

helped_plan_crime(pierre, mary, assassinat).     
provided_alibi(claire, mary, assassinat).        
hid_evidence(lucas, john, vol).                  

% Communications suspectes
phone_contact_before_crime(pierre, mary, assassinat).
money_transfer_after_crime(claire, mary, assassinat).

% Mensonges découverts
lied_to_police(claire, assassinat).
changed_testimony(lucas, vol).

% -------- SECTION 5: Règles de Culpabilité Principale --------

% VOL - Règle de base inchangée
is_guilty(Suspect, vol) :-
    has_motive(Suspect, vol),
    was_near_crime_scene(Suspect, vol),
    ( has_fingerprint_on_weapon(Suspect, vol)
    ; eyewitness_identification(Suspect, vol)
    ).

% ASSASSINAT - Règle de base inchangée  
is_guilty(Suspect, assassinat) :-
    has_motive(Suspect, assassinat),
    was_near_crime_scene(Suspect, assassinat),
    ( has_fingerprint_on_weapon(Suspect, assassinat)
    ; eyewitness_identification(Suspect, assassinat)
    ).

% ESCROQUERIE - Règle de base inchangée
is_guilty(Suspect, escroquerie) :-
    has_motive(Suspect, escroquerie),
    ( has_bank_transaction(Suspect, escroquerie)
    ; owns_fake_identity(Suspect, escroquerie)
    ; eyewitness_identification(Suspect, escroquerie)
    ).

% -------- SECTION 6: Règles de Complicité --------

% COMPLICE D'ASSASSINAT - Plusieurs façons d'être complice
is_accomplice(Person, MainCriminal, assassinat) :-
    person(Person),
    Person \= MainCriminal,
    is_guilty(MainCriminal, assassinat),
    ( helped_plan_crime(Person, MainCriminal, assassinat)
    ; provided_alibi(Person, MainCriminal, assassinat)
    ; phone_contact_before_crime(Person, MainCriminal, assassinat)
    ; money_transfer_after_crime(Person, MainCriminal, assassinat)
    ).

% COMPLICE DE VOL - Règle similaire adaptée
is_accomplice(Person, MainCriminal, vol) :-
    person(Person),
    Person \= MainCriminal,
    is_guilty(MainCriminal, vol),
    ( hid_evidence(Person, MainCriminal, vol)
    ; provided_alibi(Person, MainCriminal, vol)
    ; helped_plan_crime(Person, MainCriminal, vol)
    ).

is_accomplice(Person, MainCriminal, escroquerie) :-
    person(Person),
    Person \= MainCriminal,
    is_guilty(MainCriminal, escroquerie),
    ( money_transfer_after_crime(Person, MainCriminal, escroquerie)
    ; provided_alibi(Person, MainCriminal, escroquerie)
    ; helped_plan_crime(Person, MainCriminal, escroquerie)
    ).

% -------- SECTION 7: Évolution des Statuts --------

% Une personne devient suspecte si elle était "normale" mais a des liens suspects
becomes_suspect(Person, Crime) :-
    normal_person(Person),
    ( lied_to_police(Person, Crime)
    ; changed_testimony(Person, Crime)
    ; is_accomplice(Person, _, Crime)
    ; has_motive(Person, Crime)
    ).

final_status(Person, Crime, coupable) :-
    is_guilty(Person, Crime).

final_status(Person, Crime, complice) :-
    \+ is_guilty(Person, Crime),
    is_accomplice(Person, _, Crime).

final_status(Person, Crime, suspect) :-
    \+ is_guilty(Person, Crime),
    \+ is_accomplice(Person, _, Crime),
    ( initial_suspect(Person)
    ; becomes_suspect(Person, Crime)
    ).

final_status(Person, Crime, innocent) :-
    person(Person),
    \+ is_guilty(Person, Crime),
    \+ is_accomplice(Person, _, Crime),
    \+ initial_suspect(Person),
    \+ becomes_suspect(Person, Crime).

% -------- SECTION 8: Analyses Avancées --------

% Trouve tous les coupables (principaux + complices)
all_criminals(Crime, Criminals) :-
    findall(Person-Status, 
        (person(Person), 
         final_status(Person, Crime, Status),
         (Status = coupable ; Status = complice)
        ), 
        Criminals).

full_crime_analysis(Crime) :-
    format(' ANALYSE COMPLÈTE: ~w~n', [Crime]),
    format('═══════════════════════════~n'),
    
    % Coupables principaux
    findall(P, is_guilty(P, Crime), Guilty),
    format(' COUPABLES PRINCIPAUX: ~w~n', [Guilty]),
    
    % Complices
    findall(P, is_accomplice(P, _, Crime), Accomplices),
    format(' COMPLICES: ~w~n', [Accomplices]),
    
    % Nouveaux suspects découverts
    findall(P, becomes_suspect(P, Crime), NewSuspects),
    format(' NOUVEAUX SUSPECTS: ~w~n', [NewSuspects]),
    
    % Innocents
    findall(P, final_status(P, Crime, innocent), Innocents),
    format(' INNOCENTS: ~w~n', [Innocents]),
    writeln('').

% Réseau de complicité pour un crime
complicity_network(Crime) :-
    format(' RÉSEAU DE COMPLICITÉ - ~w~n', [Crime]),
    forall(
        is_accomplice(Accomplice, MainCriminal, Crime),
        format('  ~w ↔ ~w (complice de)~n', [Accomplice, MainCriminal])
    ).

% -------- SECTION 9: Évolution temporelle 

phase1_analysis(Crime) :-
    format(' PHASE 1 - Suspects initiaux pour ~w:~n', [Crime]),
    forall(
        (initial_suspect(S), is_guilty(S, Crime)),
        format('   ~w: COUPABLE~n', [S])
    ),
    forall(
        (initial_suspect(S), \+ is_guilty(S, Crime)),
        format('   ~w: À investiguer~n', [S])
    ).

% Phase 2: Découverte des complices et nouveaux suspects  
phase2_analysis(Crime) :-
    format('PHASE 2 - Découvertes pour ~w:~n', [Crime]),
    forall(
        becomes_suspect(P, Crime),
        format('  ~w: Devient suspect~n', [P])
    ),
    forall(
        is_accomplice(A, M, Crime),
        format('   ~w: Complice de ~w~n', [A, M])
    ).

% -------- SECTION 10: Fonctions de rapport --------

% Rapport complet sur une personne
person_report(Person) :-
    format('RAPPORT COMPLET: ~w~n', [Person]),
    format('═══════════════════════════~n'),
    forall(
        crime_type(Crime),
        (final_status(Person, Crime, Status),
         format('  ~w: ~w~n', [Crime, Status]))
    ),
    writeln('').

main_cli :-
    writeln('SYSTÈME D\'ENQUÊTE POLICIÈRE AVANCÉ'),
    writeln('Entrez une requête sous la forme: crime(suspect, type_crime).'),
    writeln('Exemple: crime(john, vol).'),
    writeln(''),
    current_input(Input),
    read(Input, crime(Suspect, CrimeType)),
    
    % Analyse le statut final
    final_status(Suspect, CrimeType, Status),
    
    ( Status = coupable -> writeln(guilty)
    ; Status = complice -> writeln(accomplice)  
    ; Status = suspect -> writeln(suspect_only)
    ; writeln(not_guilty)
    ),
    halt.

% -------- SECTION 11: Exemples de requêtes avancées --------

% ?- is_guilty(mary, assassinat).                    % true (coupable principal)
% ?- is_accomplice(pierre, mary, assassinat).        % true (complice)
% ?- becomes_suspect(claire, assassinat).            % true (devient suspecte)
% ?- final_status(pierre, assassinat, Status).       % Status = complice
% ?- full_crime_analysis(assassinat).                % Analyse complète
% ?- complicity_network(assassinat).                 % Réseau de complicité
% ?- phase1_analysis(assassinat).                    % Analyse phase 1
% ?- phase2_analysis(assassinat).                    % Analyse phase 2
% ?- person_report(pierre).                          % Rapport sur Pierre
% ?- all_criminals(assassinat, List).                % Tous les criminels