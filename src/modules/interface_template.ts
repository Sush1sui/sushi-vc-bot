import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

export const interface_embed = new EmbedBuilder()
  .setColor("White")
  .setAuthor({
    name: "Finesse VC Interface",
    iconURL:
      "https://images-ext-1.discordapp.net/external/3QmLnkyUjiyS6EAm51WT-Yyqe7bcDoF9QRTpsfECbII/https/media.tenor.com/ZjZcvkBzoNMAAAAi/pepe-scucha.gif",
  })
  .setDescription(
    `Hey, Thank you for supporting our server! Here at Finesse we make sure that our members make the most of it when they're on a VC with friends! With having the freedom to do what you please with your own voice channel!`
  )
  .setFooter({
    text: "Use the buttons below to manage your voice channel",
    iconURL:
      "https://images-ext-1.discordapp.net/external/w1oTKGUTTcVtkkPbAEF-0CkhMwuugjhfnzKoX5UCVBE/%3Fsize%3D96%26quality%3Dlossless/https/cdn.discordapp.com/emojis/1293411594621157458.gif",
  })
  .setImage("https://media.tenor.com/iJklJd0dfrcAAAAi/cat-cats.gif")
  .setTitle("ENJOY UNLIMITED VC INTERFACE ACCESS!");

export const interface_buttons_row1 =
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("lock_vc")
      .setEmoji({
        id: "1293802497735135243",
        name: "lock_vc",
      })
      .setLabel("Lock")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("unlock_vc")
      .setEmoji({
        id: "1293802495407030272",
        name: "unlock_vc",
      })
      .setLabel("Unlock")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("hide")
      .setEmoji({
        id: "1293803740113010738",
        name: "hide",
      })
      .setLabel("Hide")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("unhide")
      .setEmoji({
        id: "1293802561887010827",
        name: "unhide",
      })
      .setLabel("Unhide")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("limit")
      .setEmoji({
        id: "1293802599614648462",
        name: "limit",
      })
      .setLabel("Limit")
      .setStyle(ButtonStyle.Primary)
  );

export const interface_buttons_row2 =
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("blacklist")
      .setEmoji({
        id: "1293802490956873738",
        name: "blacklist",
      })
      .setLabel("Blacklist")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("permit")
      .setEmoji({
        id: "1293802489711431740",
        name: "permit",
      })
      .setLabel("Permit")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("rename")
      .setEmoji({
        id: "1293802483046678529",
        name: "rename",
      })
      .setLabel("Rename")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("claim_vc")
      .setEmoji({
        id: "1293802473789718531",
        name: "claim_vc",
      })
      .setLabel("Claim VC")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("transfer_owner")
      .setEmoji({
        id: "1293802472560660512",
        name: "transfer_owner",
      })
      .setLabel("Transfer Owner")
      .setStyle(ButtonStyle.Primary)
  );
