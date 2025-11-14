package com.example.entity;

import lombok.Data;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.extension.activerecord.Model;
import com.baomidou.mybatisplus.annotation.TableId;


@Data
@TableName("constructionrec")
public class Constructionrec extends Model<Constructionrec> {
    /**
      * 主键
      */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
      * 施工代码 
      */
    private Integer constructionid;

    /**
      * 施工日期 
      */
    private String date;

    /**
      * 使用施工款 
      */
    private Integer money;

    /**
      * 项目实施名称 
      */
    private String name;

    /**
      * 项目代码 
      */
    private Integer projectid;

    /**
      * 员工id 
      */
    private Integer staffid;

}