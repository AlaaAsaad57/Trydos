import 'dart:async';

import 'package:firebase_database/firebase_database.dart';
import 'package:get_it/get_it.dart';
import 'package:injectable/injectable.dart';
import 'package:trydos/core/domin/repositories/prefs_repository.dart';
import 'package:trydos/features/app/blocs/app_bloc/app_bloc.dart';
import 'package:trydos/features/app/blocs/app_bloc/app_event.dart';
import 'package:trydos/features/chat/presentation/manager/chat_bloc.dart';

import '../../../../service/language_service.dart';
import '../../data/models/my_chats_response_model.dart';

class FirebasePresence {
  static StreamSubscription? typingSubscription;
  static final AppBloc appBloc = GetIt.I<AppBloc>();
  static final int myChatId = GetIt.I<PrefsRepository>().myChatId!;
  static bool isSubscribed = false;
  static final ChatBloc chatBloc = GetIt.I<ChatBloc>();
  static final Map<String, String> descTranslation = {
    "Typing...": "يكتب...",
    "Recording...": "يسجل مقطع صوتي...",
    "Sending file...": "يرسل ملف...",
  };
  static final FirebaseDatabase database = FirebaseDatabase.instance;

  static Future<void> listeningToTyping({
    required int friendId,
    required int chatId,
  }) async {
    String description;
    final typingRef = database
        .ref()
        .child('typing')
        .child(friendId.toString())
        .child(myChatId.toString());
    typingRef.onValue.listen((event) {
      if (event.snapshot.exists) {
        description = (event.snapshot.value as Map<dynamic , dynamic>).values.first
            .toString();
        print('description  $description');
        if (LanguageService.languageCode == 'ar') {
          description = descTranslation[description] ?? description;
        }
        appBloc.add(AddUserToTypingList(friendId, chatId, description));
      } else {
        appBloc.add(RemoveUserFromTypingList(chatId));
      }
    });
  }

  static Future<void> sendUserTransaction(
      {required String channelId,
      required String transaction,
      String? description}) async {
    String friendId = [...chatBloc.state.chats, ...chatBloc.state.pinnedChats]
        .firstWhere((element) => element.id == channelId)
        .channelMembers!
        .firstWhere((element) => element.user!.id != myChatId)
        .user!
        .id
        .toString();
    DatabaseReference con;
    await database.goOnline();
    final typingRef =
        onUserTransactionRef(friendId: friendId, transaction: transaction);
    con = typingRef.push();
    con.set(description);
  }

  static DatabaseReference onUserTransactionRef(
      {required String friendId, required String transaction}) {
    return database
        .ref()
        .child(transaction)
        .child(myChatId.toString())
        .child(friendId.toString());
  }

  static void deleteUserTransaction(
      {required String channelId, required String transaction}) {
    String friendId = [...chatBloc.state.chats, ...chatBloc.state.pinnedChats]
        .firstWhere((element) => element.id == channelId)
        .channelMembers!
        .firstWhere((element) => element.user!.id != myChatId)
        .user!
        .id
        .toString();
    final typingRef =
        onUserTransactionRef(friendId: friendId, transaction: transaction);
    typingRef.remove();
  }

  static typingConnectionListener(
      {required String friendId, required String transaction}) async {
    final typingRef =
        onUserTransactionRef(friendId: friendId, transaction: transaction);
    await database.goOnline();
    typingSubscription =
        database.ref().child('.info/connected').onValue.listen((event) {
      if (event.snapshot.value != null) {
        typingRef.onDisconnect().remove();
      }
    });
  }

  static void disconnect() {
    if (!isSubscribed) return;
    if (typingSubscription != null) {
      typingSubscription?.cancel();
    }
    database.goOffline();
    isSubscribed = false;
  }

  static listenToAllChats(List<Chat> chats) {
    if (isSubscribed) return;
    for (int i = 0; i < chats.length; i++) {
      if(int.tryParse(chats[i].id.toString()) == null )continue;
      ChannelMember you = chats[i]
          .channelMembers!
          .firstWhere((element) => element.userId != myChatId);
      int friendId = you.userId!;
      listeningToTyping(chatId: int.parse(chats[i].id!), friendId: friendId);
    }
    isSubscribed = chats.length > 0;
  }
}