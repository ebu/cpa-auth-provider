"use strict";

module.exports = function(sequelize, DataTypes) {
  var OAuth2Client = sequelize.define('OAuth2Client', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    client_id: {
      type: DataTypes.STRING,
      validate: {
        notNull: true,
        notEmpty: true
      }
    },
    client_secret: {
      type: DataTypes.STRING,
      validate: {
        notNull: true,
        notEmpty: true
      }
    },
    name: {
      type: DataTypes.STRING,
      validate: {
        notNull: true,
        notEmpty: true
      }
    },
    redirect_uri: { // TODO: Use its own table (RedirectURIWhiteList)
      type: DataTypes.STRING
    },
    /**
     * Data structure to contain multiple versions of the email redirect
     * addresses. May contain a 'default' to use. Will then attempt to
     * substitute {{SUB}} with the subset to use.
     */
    email_redirects: DataTypes.STRING
  }, {
    underscored: true,

    instanceMethods: {
      getEmailRedirects: function() {
        if (this.email_redirects == undefined) {
          return undefined;
        }
        console.log(this.email_redirects);
        return JSON.parse(this.email_redirects);
      },
      setEmailRedirects: function(emailRedirects) {
        if (emailRedirects == undefined) {
          return this.updateAttributes({email_redirects: undefined});
        } else {
          return this.updateAttributes({email_redirects: JSON.stringify(emailRedirects)})
        }
      },
      mayRedirect: function(uri) {
        if (this.redirect_uri == null) {
          return true;
        }
        if (!uri) {
          return true;
        }
        return uri.startsWith(this.redirect_uri);
      }
    },

	associate: function(models) {
      OAuth2Client.hasMany(models.OAuth2AuthorizationCode);
      OAuth2Client.hasMany(models.AccessToken);
      OAuth2Client.belongsTo(models.User);
    }
  });

  return OAuth2Client;
};
